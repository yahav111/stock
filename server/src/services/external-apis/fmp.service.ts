/**
 * Financial Modeling Prep (FMP) Service
 * Provides Economic Calendar and IPO Calendar data
 * Free tier: 250 requests per day
 */
import axios from 'axios';
import { env } from '../../config/env.js';
import type { EconomicEvent, IPOEvent } from '../../types/index.js';

const FMP_BASE_URL = 'https://financialmodelingprep.com';

// Cache with 1 hour TTL (to save on 250 daily requests limit)
const cache = new Map<string, { data: EconomicEvent[] | IPOEvent[]; timestamp: number }>();
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

/**
 * Get cached data
 */
function getCached<T>(key: string): T[] | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T[];
  }
  return null;
}

/**
 * Set cache
 */
function setCache<T>(key: string, data: T[]) {
  cache.set(key, { data: data as EconomicEvent[] | IPOEvent[], timestamp: Date.now() });
}

/**
 * Get Economic Calendar from FMP
 * @param from - Start date (YYYY-MM-DD) - optional, defaults to today
 * @param to - End date (YYYY-MM-DD) - optional, defaults to +7 days
 */
export async function getEconomicCalendar(from?: string, to?: string): Promise<EconomicEvent[]> {
  const cacheKey = `fmp-economic-${from || 'default'}-${to || 'default'}`;
  const cached = getCached<EconomicEvent>(cacheKey);
  if (cached) {
    console.log(`📦 [FMP] Economic calendar cache hit`);
    return cached;
  }

  if (!env.FMP_API_KEY) {
    console.warn('❌ FMP_API_KEY not configured');
    return [];
  }

  try {
    // Default: next 7 days
    const today = new Date();
    const defaultFrom = from || today.toISOString().split('T')[0];
    const defaultTo = to || (() => {
      const future = new Date(today);
      future.setDate(future.getDate() + 7);
      return future.toISOString().split('T')[0];
    })();

    // Verify date format
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(defaultFrom) || !dateFormatRegex.test(defaultTo)) {
      console.error(`❌ Invalid date format. Expected YYYY-MM-DD, got: from=${defaultFrom}, to=${defaultTo}`);
      return [];
    }

    const url = `${FMP_BASE_URL}/stable/economic-calendar`;
    const params: Record<string, string> = {
      apikey: env.FMP_API_KEY,
      from: defaultFrom,
      to: defaultTo,
    };

    console.log(`🔍 [FMP] Economic Calendar API Call:`);
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, { ...params, apikey: '***REDACTED***' });
    console.log(`   Date Range: ${defaultFrom} to ${defaultTo} (7 days)`);

    let response;
    try {
      response = await axios.get(url, {
        params,
        timeout: 10000,
      });
    } catch (error: any) {
      // If 402 (restricted), the endpoint requires a paid subscription
      if (error.response?.status === 402) {
        console.error(`❌ [FMP] Economic Calendar endpoint restricted - requires paid subscription`);
        console.error(`   Response: ${error.response.data}`);
        return [];
      }
      throw error;
    }

    console.log(`📥 [FMP] Economic Calendar Response Status:`, response.status);
    console.log(`📥 [FMP] Economic Calendar Raw Response:`, JSON.stringify(response.data, null, 2).substring(0, 1000));

    if (response.status !== 200) {
      console.error(`❌ [FMP] Unexpected status code: ${response.status}`);
      return [];
    }

    const data = response.data;

    // Check for error in response
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error || data.message || data.Error) {
        console.error(`❌ [FMP] API returned an error:`, data.error || data.message || data.Error);
        return [];
      }
    }

    // FMP returns array directly
    let eventsArray: any[] = [];
    if (Array.isArray(data)) {
      eventsArray = data;
      console.log(`✅ [FMP] Found ${eventsArray.length} economic events`);
    } else if (data && Array.isArray(data.events)) {
      eventsArray = data.events;
      console.log(`✅ [FMP] Using data.events (${eventsArray.length} items)`);
    } else {
      console.warn(`⚠️ [FMP] Unexpected response structure:`, data);
    }

    if (eventsArray.length === 0) {
      console.log(`⚠️ [FMP] No economic events found for ${defaultFrom} to ${defaultTo}`);
      setCache(cacheKey, []);
      return [];
    }

    const events: EconomicEvent[] = eventsArray.map((item: any, index: number) => {
      const dateStr = item.date || item.eventDate || defaultFrom;
      const timeStr = item.time || item.eventTime || undefined;

      // Map FMP impact to our format
      let impact: 'high' | 'medium' | 'low' = 'low';
      if (item.impact === 'High' || item.impact === 'high' || item.importance === 'High') {
        impact = 'high';
      } else if (item.impact === 'Medium' || item.impact === 'medium' || item.importance === 'Medium') {
        impact = 'medium';
      }

      return {
        id: `fmp-economic-${dateStr}-${index}-${(item.event || item.name || 'event').substring(0, 20).replace(/\s+/g, '-')}`,
        event: item.event || item.name || item.title || 'Unknown Event',
        country: item.country || item.region || 'US',
        date: dateStr,
        time: timeStr,
        impact,
        estimate: item.estimate || item.forecast || undefined,
        actual: item.actual || item.value || undefined,
        previous: item.previous || item.prev || item.last || undefined,
        currency: item.currency || 'USD',
      };
    });

    setCache(cacheKey, events);
    console.log(`✅ [FMP] Fetched ${events.length} economic events (${defaultFrom} to ${defaultTo})`);
    return events;
  } catch (error: any) {
    console.error(`❌ [FMP] Error fetching economic calendar:`);
    console.error(`   Error message: ${error.message}`);
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data:`, JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

/**
 * Get IPO Calendar from FMP
 * @param from - Start date (YYYY-MM-DD) - optional, defaults to today
 * @param to - End date (YYYY-MM-DD) - optional, defaults to +60 days
 */
export async function getIPOCalendar(from?: string, to?: string): Promise<IPOEvent[]> {
  const cacheKey = `fmp-ipo-${from || 'default'}-${to || 'default'}`;
  const cached = getCached<IPOEvent>(cacheKey);
  if (cached) {
    console.log(`📦 [FMP] IPO calendar cache hit`);
    return cached;
  }

  if (!env.FMP_API_KEY) {
    console.warn('❌ FMP_API_KEY not configured');
    return [];
  }

  try {
    // Default: next 60 days
    const today = new Date();
    const defaultFrom = from || today.toISOString().split('T')[0];
    const defaultTo = to || (() => {
      const future = new Date(today);
      future.setDate(future.getDate() + 60);
      return future.toISOString().split('T')[0];
    })();

    // Verify date format
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(defaultFrom) || !dateFormatRegex.test(defaultTo)) {
      console.error(`❌ Invalid date format. Expected YYYY-MM-DD, got: from=${defaultFrom}, to=${defaultTo}`);
      return [];
    }

    const url = `${FMP_BASE_URL}/stable/ipos-calendar`;
    const params: Record<string, string> = {
      apikey: env.FMP_API_KEY,
      from: defaultFrom,
      to: defaultTo,
    };

    console.log(`🔍 [FMP] IPO Calendar API Call:`);
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, { ...params, apikey: '***REDACTED***' });
    console.log(`   Date Range: ${defaultFrom} to ${defaultTo} (60 days)`);

    let response;
    try {
      response = await axios.get(url, {
        params,
        timeout: 10000,
      });
    } catch (error: any) {
      // If 402 (restricted), the endpoint requires a paid subscription
      if (error.response?.status === 402) {
        console.error(`❌ [FMP] IPO Calendar endpoint restricted - requires paid subscription`);
        console.error(`   Response: ${error.response.data}`);
        return [];
      }
      throw error;
    }

    console.log(`📥 [FMP] IPO Calendar Response Status:`, response.status);
    console.log(`📥 [FMP] IPO Calendar Raw Response:`, JSON.stringify(response.data, null, 2).substring(0, 1000));

    if (response.status !== 200) {
      console.error(`❌ [FMP] Unexpected status code: ${response.status}`);
      return [];
    }

    const data = response.data;

    // Check for error in response
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error || data.message || data.Error) {
        console.error(`❌ [FMP] API returned an error:`, data.error || data.message || data.Error);
        return [];
      }
    }

    // FMP returns array directly
    let eventsArray: any[] = [];
    if (Array.isArray(data)) {
      eventsArray = data;
      console.log(`✅ [FMP] Found ${eventsArray.length} IPO events`);
    } else if (data && Array.isArray(data.ipos)) {
      eventsArray = data.ipos;
      console.log(`✅ [FMP] Using data.ipos (${eventsArray.length} items)`);
    } else {
      console.warn(`⚠️ [FMP] Unexpected response structure:`, data);
    }

    if (eventsArray.length === 0) {
      console.log(`⚠️ [FMP] No IPO events found for ${defaultFrom} to ${defaultTo}`);
      setCache(cacheKey, []);
      return [];
    }

    const events: IPOEvent[] = eventsArray.map((item: any, index: number) => {
      const dateStr = item.date || item.ipoDate || item.ipo_date || defaultFrom;

      return {
        id: `fmp-ipo-${dateStr}-${item.symbol || item.ticker || index}`,
        symbol: item.symbol || item.ticker || 'UNKNOWN',
        name: item.name || item.companyName || item.company_name || item.symbol || 'Unknown Company',
        exchange: item.exchange || item.stockExchange || item.stock_exchange || 'NYSE',
        date: dateStr,
        price: item.price || item.ipoPrice || item.ipo_price || undefined,
        shares: item.shares || item.numberOfShares || item.number_of_shares || undefined,
        totalValue: item.totalValue || item.total_value || item.marketValue || item.market_value || 
                   (item.price && item.shares ? item.price * item.shares : undefined),
        status: item.status === 'Priced' || item.status === 'priced' ? 'priced' : 
                item.status === 'Withdrawn' || item.status === 'withdrawn' ? 'withdrawn' : 'upcoming',
      };
    });

    setCache(cacheKey, events);
    console.log(`✅ [FMP] Fetched ${events.length} IPO events (${defaultFrom} to ${defaultTo})`);
    return events;
  } catch (error: any) {
    console.error(`❌ [FMP] Error fetching IPO calendar:`);
    console.error(`   Error message: ${error.message}`);
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data:`, JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

