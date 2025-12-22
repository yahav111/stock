/**
 * Crypto Chart Provider
 * Adapter for CryptoCompare historical OHLC data
 */
import axios from 'axios';
import type { IChartProvider } from './chart-provider.interface.js';
import type { HistoricalBar, ChartDataParams } from '../types.js';
import { isCrypto } from '../symbol-detector.js';
import { env } from '../../../config/env.js';

const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com';

// Cache for historical data
const historyCache = new Map<string, { data: HistoricalBar[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key: string): HistoricalBar[] | null {
  const cached = historyCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: HistoricalBar[]) {
  historyCache.set(key, { data, timestamp: Date.now() });
}

export class CryptoChartProvider implements IChartProvider {
  supports(symbol: string): boolean {
    return isCrypto(symbol);
  }

  async getHistory(params: ChartDataParams): Promise<HistoricalBar[]> {
    const { symbol, timespan, limit } = params;
    
    // Dynamic cache key with date to ensure daily refresh
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `crypto-history:${symbol}:${timespan}:${limit}:${today}`;
    
    // Check cache with TTL based on timespan
    const cached = getCached(cacheKey);
    if (cached) {
      // Additional check: is cache stale based on timespan?
      const cacheAge = Date.now() - (historyCache.get(cacheKey)?.timestamp || 0);
      const ttl = timespan === 'day' ? 60 * 60 * 1000 :      // 1 hour for daily
                  timespan === 'week' ? 6 * 60 * 60 * 1000 :  // 6 hours for weekly
                  24 * 60 * 60 * 1000;                        // 24 hours for monthly
      
      if (cacheAge < ttl) {
        console.log(`📦 Cache hit for ${symbol} crypto history`);
        return cached;
      }
    }

    try {
      // CryptoCompare API: /data/v2/histoday returns data up to TODAY
      // It automatically uses current date as 'to', so we just need to specify limit
      // The API always returns the most recent data up to now
      let endpoint = 'histoday';
      let limitParam = limit;
      
      if (timespan === 'week') {
        endpoint = 'histoday';
        limitParam = Math.min(limit * 7, 2000); // Max 2000 days
      } else if (timespan === 'month') {
        endpoint = 'histoday';
        limitParam = Math.min(limit * 30, 2000);
      } else {
        // day
        limitParam = Math.min(limit, 2000);
      }

      // CryptoCompare automatically uses current date, so we don't need to specify 'to'
      // It always returns the most recent 'limit' bars up to today
      const url = `${CRYPTOCOMPARE_BASE_URL}/data/v2/${endpoint}`;
      const params: Record<string, string | number> = {
        fsym: symbol.toUpperCase(),
        tsym: 'USD',
        limit: limitParam,
      };
      
      console.log(`📡 Fetching ${symbol} crypto history: ${timespan} (${limitParam} bars, up to today)`);

      if (env.CRYPTOCOMPARE_API_KEY) {
        params.api_key = env.CRYPTOCOMPARE_API_KEY;
      }

      console.log(`📡 Fetching ${symbol} crypto history: ${timespan} (${limitParam} bars)`);

      const response = await axios.get(url, {
        params,
        timeout: 15000,
      });

      const data = response.data.Data;
      if (!data || !data.Data || data.Data.length === 0) {
        console.warn(`No crypto history data for ${symbol}`);
        return this.getMockHistory(symbol, limit, timespan);
      }

      // Convert CryptoCompare format to unified format
      const bars: HistoricalBar[] = data.Data.map((bar: any) => ({
        time: bar.time, // Already in seconds
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volumefrom || bar.volumeto || 0,
      }));

      // Take only what we need (most recent)
      const result = bars.slice(-limit);

      setCache(cacheKey, result);
      console.log(`✅ Got ${result.length} crypto bars for ${symbol}`);
      return result;

    } catch (error: any) {
      console.error(`Error fetching crypto history for ${symbol}:`, error.message);
      
      // Return mock data if API fails
      return this.getMockHistory(symbol, limit, timespan);
    }
  }

  async getQuote(symbol: string) {
    // Use existing crypto service for quotes
    const { getCryptoPrice } = await import('../../external-apis/cryptocompare.service.js');
    const crypto = await getCryptoPrice(symbol);
    
    if (!crypto) return null;

    return {
      symbol: crypto.symbol,
      price: crypto.price,
      change: crypto.change24h,
      changePercent: crypto.changePercent24h,
      volume: crypto.volume24h,
      timestamp: crypto.timestamp,
      name: crypto.name,
    };
  }

  /**
   * Generate mock historical data for development/fallback
   */
  private getMockHistory(symbol: string, count: number, timespan: 'day' | 'week' | 'month'): HistoricalBar[] {
    const mockPrices: Record<string, number> = {
      BTC: 43500,
      ETH: 2280,
      SOL: 98,
      BNB: 312,
      XRP: 0.62,
      ADA: 0.58,
      DOGE: 0.092,
      AVAX: 35,
      DOT: 7.2,
      MATIC: 0.89,
      LINK: 14.5,
      UNI: 6.8,
      ATOM: 9.2,
      LTC: 72,
      BCH: 245,
      ALGO: 0.18,
      ETC: 23,
      XLM: 0.12,
      FIL: 4.5,
      AAVE: 95,
      SAND: 0.45,
      MANA: 0.38,
      AXS: 7.2,
      THETA: 0.95,
      EOS: 0.75,
    };

    const intervalSeconds = {
      day: 24 * 60 * 60,
      week: 7 * 24 * 60 * 60,
      month: 30 * 24 * 60 * 60,
    }[timespan];

    const history: HistoricalBar[] = [];
    let price = (mockPrices[symbol] || 100) * 0.9;
    
    // Always use current date - no hardcoded dates
    // For crypto: use today (markets are 24/7)
    const now = new Date();
    now.setHours(23, 59, 59, 0); // End of today
    const endTime = Math.floor(now.getTime() / 1000);
    const baseTime = endTime - (count - 1) * intervalSeconds;

    for (let i = 0; i < count; i++) {
      const time = baseTime + i * intervalSeconds;
      const changePercent = 0.05;
      const dailyChange = (Math.random() - 0.48) * (price * changePercent);
      const open = price;
      const close = price + dailyChange;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);

      history.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000000),
      });
      price = close;
    }

    return history;
  }
}

