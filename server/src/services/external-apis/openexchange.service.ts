import axios from 'axios';
import { env } from '../../config/env.js';
import type { CurrencyRate } from '../../types/index.js';

const OPENEXCHANGE_BASE_URL = 'https://openexchangerates.org/api';

// In-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour (rates don't change frequently)

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getExchangeRates(base: string = 'USD'): Promise<Record<string, number>> {
  const cacheKey = `rates:${base}`;
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  if (!env.OPENEXCHANGERATES_APP_ID) {
    console.warn('Open Exchange Rates API not configured, returning mock data');
    return getMockRates();
  }

  try {
    const response = await axios.get(`${OPENEXCHANGE_BASE_URL}/latest.json`, {
      params: {
        app_id: env.OPENEXCHANGERATES_APP_ID,
        base,
      },
    });

    const rates = response.data.rates;
    setCache(cacheKey, rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return getMockRates();
  }
}

export async function getCurrencyPairs(pairs: string[]): Promise<CurrencyRate[]> {
  const rates = await getExchangeRates();
  
  return pairs.map((pair) => {
    const [base, target] = pair.split('/');
    const rate = calculateRate(rates, base, target);
    
    return {
      base,
      target,
      rate,
      change: (Math.random() - 0.5) * 0.01,
      changePercent: (Math.random() - 0.5) * 1,
      timestamp: Date.now(),
    };
  });
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ amount: number; rate: number }> {
  const rates = await getExchangeRates();
  const rate = calculateRate(rates, from, to);
  
  return {
    amount: amount * rate,
    rate,
  };
}

function calculateRate(
  rates: Record<string, number>,
  from: string,
  to: string
): number {
  if (from === 'USD') {
    return rates[to] || 1;
  }
  if (to === 'USD') {
    return 1 / (rates[from] || 1);
  }
  // Cross rate: from -> USD -> to
  return (rates[to] || 1) / (rates[from] || 1);
}

// Mock data for development
function getMockRates(): Record<string, number> {
  return {
    USD: 1,
    EUR: 0.9234,
    GBP: 0.7912,
    ILS: 3.6845,
    JPY: 149.52,
    CHF: 0.8823,
    CAD: 1.3567,
    AUD: 1.5234,
    CNY: 7.2345,
    INR: 83.12,
    KRW: 1298.45,
    SGD: 1.3421,
    HKD: 7.8123,
    SEK: 10.4567,
    NOK: 10.8234,
    DKK: 6.8912,
    NZD: 1.6234,
    MXN: 17.2345,
    BRL: 4.9876,
    RUB: 92.3456,
  };
}

// Get currency name
export function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    ILS: 'Israeli Shekel',
    JPY: 'Japanese Yen',
    CHF: 'Swiss Franc',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CNY: 'Chinese Yuan',
    INR: 'Indian Rupee',
    KRW: 'South Korean Won',
    SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar',
    SEK: 'Swedish Krona',
    NOK: 'Norwegian Krone',
    DKK: 'Danish Krone',
    NZD: 'New Zealand Dollar',
    MXN: 'Mexican Peso',
    BRL: 'Brazilian Real',
    RUB: 'Russian Ruble',
  };
  return names[code] || code;
}

