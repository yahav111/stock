/**
 * Finnhub Service
 * Provides stock quotes and market news via REST API
 * Uses polling every 1 minute (60 requests/minute limit on free tier)
 */
import axios from 'axios';
import { env } from '../../config/env.js';
import type { StockQuote, MarketNews, EconomicEvent, EarningsEvent, IPOEvent } from '../../types/index.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Cache for quotes
const cache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (matches free tier update frequency)

/**
 * Get cached quote
 */
function getCached(symbol: string): StockQuote | null {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * Set cache
 */
function setCache(symbol: string, quote: StockQuote) {
  cache.set(symbol, { data: quote, timestamp: Date.now() });
}

/**
 * Get stock quote via REST API
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  // Check cache first (but still fetch fresh data if cache is old)
  const cached = getCached(symbol);
  
  if (!env.FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return cached; // Return cached data if available
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: env.FINNHUB_API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;
    if (!data || data.c === 0 || data.c === null) { // c is current price
      console.warn(`No price data from Finnhub for ${symbol}, using cached if available`);
      return cached;
    }

    const quote: StockQuote = {
      symbol: symbol.toUpperCase(),
      price: data.c, // current price
      change: data.d || 0, // change
      changePercent: data.dp || 0, // change percent
      volume: 0, // not available in quote endpoint
      timestamp: Date.now(),
    };

    setCache(symbol, quote);
    console.log(`✅ [FINNHUB] Fetched current price for ${symbol}: $${quote.price.toFixed(2)} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%) - Source: Real-time (15min delay on free tier)`);
    return quote;
  } catch (error: any) {
    console.error(`❌ Error fetching stock quote from Finnhub for ${symbol}:`, error.message || error);
    return cached; // Return cached data if fetch fails
  }
}

/**
 * Get multiple stock quotes
 */
export async function getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  // Try to get from cache first
  const quotes: StockQuote[] = [];
  const uncachedSymbols: string[] = [];

  for (const symbol of symbols) {
    const cached = getCached(symbol);
    if (cached) {
      quotes.push(cached);
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  // Fetch uncached symbols
  if (uncachedSymbols.length > 0) {
    const fetchPromises = uncachedSymbols.map(symbol => getStockQuote(symbol));
    const results = await Promise.all(fetchPromises);
    
    results.forEach(quote => {
      if (quote) {
        quotes.push(quote);
      }
    });
  }

  return quotes;
}

/**
 * Initialize Finnhub service (call on server startup)
 * Uses REST API polling for stock quotes
 */
export function initFinnhubService(): void {
  if (env.FINNHUB_API_KEY) {
    console.log('🚀 Initializing Finnhub service (REST API polling mode)...');
    console.log('✅ Finnhub service initialized - will use REST API for quotes');
  } else {
    console.log('⚠️ Finnhub API key not configured, service will not initialize');
  }
}

/**
 * Get service status
 */
export function getServiceStatus(): { connected: boolean; subscribedCount: number } {
  return {
    connected: true, // Always connected via REST API
    subscribedCount: 0, // Not tracking subscriptions (using polling instead)
  };
}

// News cache
const newsCache = new Map<string, { data: MarketNews[]; timestamp: number }>();
const NEWS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

/**
 * Get market news from Finnhub
 * @param category - News category (general, forex, crypto, merger)
 * @param minId - Optional minimum news ID for pagination
 */
export async function getMarketNews(
  category: string = 'general',
  minId?: number
): Promise<MarketNews[]> {
  // Check cache first
  const cacheKey = `${category}-${minId || 'latest'}`;
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
    return cached.data;
  }

  if (!env.FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return [];
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
      params: {
        category: category,
        token: env.FINNHUB_API_KEY,
        ...(minId && { minId }),
      },
      timeout: 10000,
    });

    const data = response.data;
    if (!Array.isArray(data)) {
      return [];
    }

    // Normalize and deduplicate news
    const seenIds = new Set<string>();
    const seenHeadlines = new Set<string>();
    const normalizedNews: MarketNews[] = [];

    for (const item of data) {
      // Create unique ID from Finnhub's id or generate from headline
      const id = item.id?.toString() || `news-${item.headline?.substring(0, 50).replace(/\s+/g, '-')}`;
      const headline = item.headline || item.title || 'No headline';

      // Deduplicate by ID or headline
      if (seenIds.has(id) || seenHeadlines.has(headline.toLowerCase())) {
        continue;
      }

      seenIds.add(id);
      seenHeadlines.add(headline.toLowerCase());

      // Normalize publishedAt timestamp (Finnhub uses seconds, convert to milliseconds)
      const publishedAt = item.datetime 
        ? item.datetime * 1000 
        : (item.time || Date.now());

      // Try to get image from Finnhub response, or use placeholder
      // Finnhub doesn't provide images directly, but we can use a placeholder service
      const imageUrl = item.image || item.thumbnail || undefined;

      const newsItem: MarketNews = {
        id,
        headline,
        summary: item.summary || item.description || '',
        source: item.source || 'Unknown',
        publishedAt,
        relatedTickers: item.related ? item.related.split(',').map((t: string) => t.trim()) : [],
        url: item.url || item.link || '',
        image: imageUrl, // Will be undefined if not available
      };

      normalizedNews.push(newsItem);
    }

    // Update cache
    newsCache.set(cacheKey, { data: normalizedNews, timestamp: Date.now() });

    console.log(`✅ Fetched ${normalizedNews.length} market news items from Finnhub (category: ${category})`);
    return normalizedNews;
  } catch (error: any) {
    console.error(`❌ Error fetching market news from Finnhub:`, error.message || error);
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    return [];
  }
}

// Calendar cache with different TTLs
const calendarCache = new Map<string, { data: EconomicEvent[] | EarningsEvent[] | IPOEvent[]; timestamp: number; ttl: number }>();

// Cache TTLs (in milliseconds)
const ECONOMIC_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const EARNINGS_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const IPO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached calendar data with type-specific TTL
 */
function getCachedCalendar<T>(key: string, ttl: number): T[] | null {
  const cached = calendarCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T[];
  }
  return null;
}

/**
 * Set calendar cache with TTL
 */
function setCalendarCache<T>(key: string, data: T[], ttl: number) {
  calendarCache.set(key, { 
    data: data as EconomicEvent[] | EarningsEvent[] | IPOEvent[], 
    timestamp: Date.now(),
    ttl 
  });
}

/**
 * Get Economic Calendar - uses FMP (Financial Modeling Prep) instead of Finnhub
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getEconomicCalendar(from?: string, to?: string): Promise<EconomicEvent[]> {
  // Use FMP for Economic Calendar (better free tier support)
  if (env.FMP_API_KEY) {
    try {
      const { getEconomicCalendar: getFMPEconomic } = await import('./fmp.service.js');
      const fmpEvents = await getFMPEconomic(from, to);
      if (fmpEvents && fmpEvents.length >= 0) { // Return even if empty (to show proper message)
        console.log(`✅ [ECONOMIC] Using FMP (${fmpEvents.length} events)`);
        return fmpEvents;
      }
    } catch (error: any) {
      console.log(`⚠️ [ECONOMIC] FMP failed, trying Finnhub:`, error.message || error);
    }
  }

  // Fallback to Finnhub (if FMP not available)
  const cacheKey = `economic-${from || 'default'}-${to || 'default'}`;
  const cached = getCachedCalendar<EconomicEvent>(cacheKey, ECONOMIC_CACHE_TTL);
  if (cached) {
    console.log(`📦 [CACHE] Economic calendar hit for ${cacheKey}`);
    return cached;
  }

  if (!env.FINNHUB_API_KEY) {
    console.warn('❌ Neither FMP nor Finnhub API key configured');
    return [];
  }

  try {
    // Economic Calendar endpoint: /calendar/economic
    // Free tier: Returns major G20 events only (no from/to needed)
    // Premium: Supports from/to parameters for date filtering
    
    // For free tier, try without from/to first, then with if provided
    const today = new Date();
    let defaultFrom: string | undefined = from;
    let defaultTo: string | undefined = to;
    
    // Only set defaults if explicitly provided
    if (!from && !to) {
      // Free tier: don't send from/to, let API return default range
      console.log(`ℹ️ [ECONOMIC] No date range provided - using API default (free tier: G20 events)`);
    } else {
      // If dates provided, validate and use them
      if (!from) {
        const past = new Date(today);
        past.setDate(past.getDate() - 7);
        defaultFrom = past.toISOString().split('T')[0];
      }
      if (!to) {
        const future = new Date(today);
        future.setDate(future.getDate() + 30);
        defaultTo = future.toISOString().split('T')[0];
      }
      
      // Verify date format is YYYY-MM-DD
      const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (defaultFrom && !dateFormatRegex.test(defaultFrom)) {
        console.error(`❌ Invalid date format for 'from': ${defaultFrom}`);
        defaultFrom = undefined;
      }
      if (defaultTo && !dateFormatRegex.test(defaultTo)) {
        console.error(`❌ Invalid date format for 'to': ${defaultTo}`);
        defaultTo = undefined;
      }
    }

    const params: Record<string, string> = {
      token: env.FINNHUB_API_KEY,
    };

    // Add from/to only if provided and valid (optional for free tier)
    if (defaultFrom) {
      params.from = defaultFrom;
    }
    if (defaultTo) {
      params.to = defaultTo;
    }

    const url = `${FINNHUB_BASE_URL}/calendar/economic`;
    console.log(`🔍 [DEBUG] Economic Calendar API Call:`);
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, { ...params, token: '***REDACTED***' });
    if (defaultFrom && defaultTo) {
      const daysDiff = Math.round((new Date(defaultTo).getTime() - new Date(defaultFrom).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   Date Range: ${defaultFrom} to ${defaultTo} (${daysDiff} days)`);
    } else {
      console.log(`   Date Range: Using API default (free tier: G20 events)`);
    }

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    console.log(`📥 [DEBUG] Economic Calendar Response Status:`, response.status);
    console.log(`📥 [DEBUG] Economic Calendar Response Headers:`, response.headers);
    console.log(`📥 [DEBUG] Economic Calendar Raw Response Type:`, typeof response.data);
    console.log(`📥 [DEBUG] Economic Calendar Raw Response:`, JSON.stringify(response.data, null, 2));

    // Check HTTP status code
    if (response.status !== 200) {
      console.error(`❌ [HTTP ERROR] Unexpected status code: ${response.status}`);
      return [];
    }

    const data = response.data;

    // Check for error in response
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error || data.message || data.status === 'error') {
        console.error(`❌ [API ERROR] API returned an error:`, data.error || data.message || data);
        return [];
      }
    }
    
    // Deep inspection of response structure
    console.log(`📊 [DEBUG] Response structure analysis:`);
    console.log(`   - isArray: ${Array.isArray(data)}`);
    console.log(`   - isObject: ${data && typeof data === 'object' && !Array.isArray(data)}`);
    console.log(`   - isNull: ${data === null}`);
    console.log(`   - isUndefined: ${data === undefined}`);
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log(`   - Object keys: ${Object.keys(data).join(', ')}`);
      Object.keys(data).forEach(key => {
        const value = data[key];
        console.log(`   - ${key}: type=${typeof value}, isArray=${Array.isArray(value)}, length=${Array.isArray(value) ? value.length : 'N/A'}`);
        if (Array.isArray(value) && value.length > 0) {
          console.log(`     First item sample:`, JSON.stringify(value[0], null, 2));
        }
      });
    }
    
    // Handle different response structures - try multiple possibilities
    let eventsArray: any[] = [];
    
    // Try 1: Direct array
    if (Array.isArray(data)) {
      eventsArray = data;
      console.log(`✅ [PARSING] Using direct array response (${eventsArray.length} items)`);
    }
    // Try 2: data.economicCalendar
    else if (data && typeof data === 'object' && Array.isArray(data.economicCalendar)) {
      eventsArray = data.economicCalendar;
      console.log(`✅ [PARSING] Using data.economicCalendar (${eventsArray.length} items)`);
    }
    // Try 3: data.events
    else if (data && typeof data === 'object' && Array.isArray(data.events)) {
      eventsArray = data.events;
      console.log(`✅ [PARSING] Using data.events (${eventsArray.length} items)`);
    }
    // Try 4: data.data (nested)
    else if (data && typeof data === 'object' && Array.isArray(data.data)) {
      eventsArray = data.data;
      console.log(`✅ [PARSING] Using data.data (${eventsArray.length} items)`);
    }
    // Try 5: data.result
    else if (data && typeof data === 'object' && Array.isArray(data.result)) {
      eventsArray = data.result;
      console.log(`✅ [PARSING] Using data.result (${eventsArray.length} items)`);
    }
    // Try 6: Check for any array property
    else if (data && typeof data === 'object') {
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        console.log(`⚠️ [PARSING] Found array properties: ${arrayKeys.join(', ')}. Trying first one: ${arrayKeys[0]}`);
        eventsArray = data[arrayKeys[0]];
        console.log(`✅ [PARSING] Using data.${arrayKeys[0]} (${eventsArray.length} items)`);
      } else {
        console.warn(`❌ [PARSING] No array found in response object. Keys: ${Object.keys(data).join(', ')}`);
        console.warn(`   Full response:`, JSON.stringify(data, null, 2));
      }
    }
    else {
      console.error(`❌ [PARSING] Unexpected response type: ${typeof data}`);
      console.error(`   Response value:`, data);
    }

    if (eventsArray.length === 0) {
      console.log(`⚠️ No economic events found for ${defaultFrom} to ${defaultTo}`);
      console.log(`   This could mean:`);
      console.log(`   1) No events in this date range`);
      console.log(`   2) API returned empty array`);
      console.log(`   3) Wrong response structure (we tried multiple parsing methods)`);
      console.log(`   4) API key doesn't have access to this endpoint`);
      console.log(`   5) Rate limit exceeded`);
      console.log(`   Full response was logged above for debugging.`);
      setCalendarCache(cacheKey, [], ECONOMIC_CACHE_TTL);
      return [];
    }

    console.log(`✅ [SUCCESS] Successfully parsed ${eventsArray.length} economic events`);

    const events: EconomicEvent[] = eventsArray.map((item: any, index: number) => {
      const dateStr = item.date || item.time || defaultFrom;
      const timeStr = item.time || item.eventTime || undefined;

      return {
        id: `economic-${dateStr}-${index}-${(item.event || item.name || 'event').substring(0, 20).replace(/\s+/g, '-')}`,
        event: item.event || item.name || 'Unknown Event',
        country: item.country || item.region || 'US',
        date: dateStr,
        time: timeStr,
        impact: (item.impact === 'high' || item.impact === 'High' || item.importance === 'high') ? 'high' : 
                (item.impact === 'medium' || item.impact === 'Medium' || item.importance === 'medium') ? 'medium' : 'low',
        estimate: item.estimate || item.forecast || undefined,
        actual: item.actual || item.value || undefined,
        previous: item.prev || item.previous || item.last || undefined,
        currency: item.currency || 'USD',
      };
    });

    setCalendarCache(cacheKey, events, ECONOMIC_CACHE_TTL);
    console.log(`✅ Fetched ${events.length} economic events from Finnhub (${defaultFrom} to ${defaultTo})`);
    return events;
  } catch (error: any) {
    console.error(`❌ Error fetching economic calendar from Finnhub:`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error code: ${error.code}`);
    
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response status text: ${error.response.statusText}`);
      console.error(`   Response headers:`, error.response.headers);
      console.error(`   Response data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error(`   Request was made but no response received`);
      console.error(`   Request details:`, error.request);
    }
    
    console.error(`   Full error:`, error);
    return cached || [];
  }
}

/**
 * Get Earnings Calendar from Finnhub
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param symbol - Optional symbol filter
 */
export async function getEarningsCalendar(from?: string, to?: string, symbol?: string): Promise<EarningsEvent[]> {
  const cacheKey = `earnings-${from || 'default'}-${to || 'default'}-${symbol || 'all'}`;
  const cached = getCachedCalendar<EarningsEvent>(cacheKey, EARNINGS_CACHE_TTL);
  if (cached) {
    console.log(`📦 [CACHE] Earnings calendar hit for ${cacheKey}`);
    return cached;
  }

  if (!env.FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return [];
  }

  try {
    // Default to next 30 days if no dates provided
    const today = new Date();
    const defaultFrom = from || today.toISOString().split('T')[0];
    const defaultTo = to || (() => {
      const future = new Date(today);
      future.setDate(future.getDate() + 30);
      return future.toISOString().split('T')[0];
    })();

    const params: Record<string, string> = {
      from: defaultFrom,
      to: defaultTo,
      token: env.FINNHUB_API_KEY,
    };

    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    const response = await axios.get(`${FINNHUB_BASE_URL}/calendar/earnings`, {
      params,
      timeout: 10000,
    });

    const data = response.data;
    
    // Handle different response structures
    let eventsArray: any[] = [];
    if (Array.isArray(data)) {
      eventsArray = data;
    } else if (data && Array.isArray(data.earningsCalendar)) {
      eventsArray = data.earningsCalendar;
    } else if (data && data.earnings && Array.isArray(data.earnings)) {
      eventsArray = data.earnings;
    }

    if (eventsArray.length === 0) {
      console.log(`⚠️ No earnings events found for ${defaultFrom} to ${defaultTo}`);
      setCalendarCache(cacheKey, [], EARNINGS_CACHE_TTL);
      return [];
    }

    const events: EarningsEvent[] = eventsArray.map((item: any, index: number) => {
      const dateStr = item.date || item.reportDate || defaultFrom;

      return {
        id: `earnings-${dateStr}-${item.symbol || 'UNKNOWN'}-${index}`,
        symbol: item.symbol || item.ticker || 'UNKNOWN',
        name: item.name || item.companyName || item.symbol || 'Unknown Company',
        date: dateStr,
        time: item.hour === 'bmo' || item.time === 'bmo' ? 'bmo' : 
              item.hour === 'amc' || item.time === 'amc' ? 'amc' : undefined,
        epsEstimate: item.epsEstimate || item.epsForecast || undefined,
        epsActual: item.epsActual || item.eps || undefined,
        revenueEstimate: item.revenueEstimate || item.revenueForecast || undefined,
        revenueActual: item.revenueActual || item.revenue || undefined,
        year: item.year || undefined,
        quarter: item.quarter || item.quarterNumber || undefined,
      };
    });

    setCalendarCache(cacheKey, events, EARNINGS_CACHE_TTL);
    console.log(`✅ Fetched ${events.length} earnings events from Finnhub (${defaultFrom} to ${defaultTo})`);
    return events;
  } catch (error: any) {
    console.error(`❌ Error fetching earnings calendar from Finnhub:`, error.message || error);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`, error.response.data);
    }
    return cached || [];
  }
}

/**
 * Get IPO Calendar - uses FMP (Financial Modeling Prep) first, then fallback to Finnhub
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getIPOCalendar(from?: string, to?: string): Promise<IPOEvent[]> {
  // Use FMP first (better free tier support for IPOs)
  if (env.FMP_API_KEY) {
    try {
      const { getIPOCalendar: getFMPIPOs } = await import('./fmp.service.js');
      const fmpIPOs = await getFMPIPOs(from, to);
      if (fmpIPOs && fmpIPOs.length >= 0) { // Return even if empty (to show proper message)
        console.log(`✅ [IPO] Using FMP (${fmpIPOs.length} events)`);
        return fmpIPOs;
      }
    } catch (error: any) {
      console.log(`⚠️ [IPO] FMP failed, trying Finnhub:`, error.message || error);
    }
  }

  // Fallback to Finnhub
  const cacheKey = `ipo-${from || 'default'}-${to || 'default'}`;
  const cached = getCachedCalendar<IPOEvent>(cacheKey, IPO_CACHE_TTL);
  if (cached) {
    console.log(`📦 [CACHE] IPO calendar hit for ${cacheKey}`);
    return cached;
  }

  if (!env.FINNHUB_API_KEY) {
    console.warn('❌ Finnhub API key not configured');
    return [];
  }

  // Validate API key format (should be a string)
  if (typeof env.FINNHUB_API_KEY !== 'string' || env.FINNHUB_API_KEY.length < 10) {
    console.error('❌ Invalid Finnhub API key format');
    return [];
  }

  console.log(`🔑 [DEBUG] Using Finnhub API key (length: ${env.FINNHUB_API_KEY.length})`);

  try {
    // Default: from (current) to (current + 6 months)
    const today = new Date();
    const defaultFrom = from || today.toISOString().split('T')[0];
    const defaultTo = to || (() => {
      const future = new Date(today);
      future.setMonth(future.getMonth() + 6);
      return future.toISOString().split('T')[0];
    })();

    // Verify date format is YYYY-MM-DD
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(defaultFrom) || !dateFormatRegex.test(defaultTo)) {
      console.error(`❌ Invalid date format. Expected YYYY-MM-DD, got: from=${defaultFrom}, to=${defaultTo}`);
      return [];
    }

    const params: Record<string, string> = {
      from: defaultFrom,
      to: defaultTo,
      token: env.FINNHUB_API_KEY,
    };

    const url = `${FINNHUB_BASE_URL}/calendar/ipo`;
    console.log(`🔍 [DEBUG] IPO Calendar API Call:`);
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, { ...params, token: '***REDACTED***' });
    console.log(`   Date Range: ${defaultFrom} to ${defaultTo} (${Math.round((new Date(defaultTo).getTime() - new Date(defaultFrom).getTime()) / (1000 * 60 * 60 * 24))} days)`);

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    console.log(`📥 [DEBUG] IPO Calendar Response Status:`, response.status);
    console.log(`📥 [DEBUG] IPO Calendar Response Headers:`, response.headers);
    console.log(`📥 [DEBUG] IPO Calendar Raw Response Type:`, typeof response.data);
    console.log(`📥 [DEBUG] IPO Calendar Raw Response:`, JSON.stringify(response.data, null, 2));

    // Check HTTP status code
    if (response.status !== 200) {
      console.error(`❌ [HTTP ERROR] Unexpected status code: ${response.status}`);
      return [];
    }

    const data = response.data;

    // Check for error in response
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error || data.message || data.status === 'error') {
        console.error(`❌ [API ERROR] API returned an error:`, data.error || data.message || data);
        return [];
      }
    }
    
    // Deep inspection of response structure
    console.log(`📊 [DEBUG] IPO Response structure analysis:`);
    console.log(`   - isArray: ${Array.isArray(data)}`);
    console.log(`   - isObject: ${data && typeof data === 'object' && !Array.isArray(data)}`);
    console.log(`   - isNull: ${data === null}`);
    console.log(`   - isUndefined: ${data === undefined}`);
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log(`   - Object keys: ${Object.keys(data).join(', ')}`);
      Object.keys(data).forEach(key => {
        const value = data[key];
        console.log(`   - ${key}: type=${typeof value}, isArray=${Array.isArray(value)}, length=${Array.isArray(value) ? value.length : 'N/A'}`);
        if (Array.isArray(value) && value.length > 0) {
          console.log(`     First item sample:`, JSON.stringify(value[0], null, 2));
        }
      });
    }
    
    // Handle different response structures - try multiple possibilities
    let eventsArray: any[] = [];
    
    // Try 1: Direct array
    if (Array.isArray(data)) {
      eventsArray = data;
      console.log(`✅ [PARSING] Using direct array response (${eventsArray.length} items)`);
    }
    // Try 2: data.ipoCalendar
    else if (data && typeof data === 'object' && Array.isArray(data.ipoCalendar)) {
      eventsArray = data.ipoCalendar;
      console.log(`✅ [PARSING] Using data.ipoCalendar (${eventsArray.length} items)`);
    }
    // Try 3: data.ipos
    else if (data && typeof data === 'object' && Array.isArray(data.ipos)) {
      eventsArray = data.ipos;
      console.log(`✅ [PARSING] Using data.ipos (${eventsArray.length} items)`);
    }
    // Try 4: data.data (nested)
    else if (data && typeof data === 'object' && Array.isArray(data.data)) {
      eventsArray = data.data;
      console.log(`✅ [PARSING] Using data.data (${eventsArray.length} items)`);
    }
    // Try 5: data.result
    else if (data && typeof data === 'object' && Array.isArray(data.result)) {
      eventsArray = data.result;
      console.log(`✅ [PARSING] Using data.result (${eventsArray.length} items)`);
    }
    // Try 6: Check for any array property
    else if (data && typeof data === 'object') {
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        console.log(`⚠️ [PARSING] Found array properties: ${arrayKeys.join(', ')}. Trying first one: ${arrayKeys[0]}`);
        eventsArray = data[arrayKeys[0]];
        console.log(`✅ [PARSING] Using data.${arrayKeys[0]} (${eventsArray.length} items)`);
      } else {
        console.warn(`❌ [PARSING] No array found in response object. Keys: ${Object.keys(data).join(', ')}`);
        console.warn(`   Full response:`, JSON.stringify(data, null, 2));
      }
    }
    else {
      console.error(`❌ [PARSING] Unexpected response type: ${typeof data}`);
      console.error(`   Response value:`, data);
    }

    if (eventsArray.length === 0) {
      console.log(`⚠️ No IPO events found for ${defaultFrom} to ${defaultTo}`);
      console.log(`   This could mean:`);
      console.log(`   1) No IPOs in this date range`);
      console.log(`   2) API returned empty array`);
      console.log(`   3) Wrong response structure (we tried multiple parsing methods)`);
      console.log(`   4) API key doesn't have access to this endpoint`);
      console.log(`   5) Rate limit exceeded`);
      console.log(`   Full response was logged above for debugging.`);
      setCalendarCache(cacheKey, [], IPO_CACHE_TTL);
      return [];
    }

    console.log(`✅ [SUCCESS] Successfully parsed ${eventsArray.length} IPO events`);

    const events: IPOEvent[] = eventsArray.map((item: any, index: number) => {
      const dateStr = item.date || item.ipoDate || defaultFrom;

      return {
        id: `ipo-${dateStr}-${item.symbol || index}`,
        symbol: item.symbol || item.ticker || 'UNKNOWN',
        name: item.name || item.companyName || item.symbol || 'Unknown Company',
        exchange: item.exchange || item.stockExchange || 'NYSE',
        date: dateStr,
        price: item.price || item.ipoPrice || undefined,
        shares: item.shares || item.numberOfShares || undefined,
        totalValue: item.totalSharesValue || item.totalValue || item.marketValue || undefined,
        status: item.status === 'Priced' || item.status === 'priced' ? 'priced' : 
                item.status === 'Withdrawn' || item.status === 'withdrawn' ? 'withdrawn' : 'upcoming',
      };
    });

    setCalendarCache(cacheKey, events, IPO_CACHE_TTL);
    console.log(`✅ Fetched ${events.length} IPO events from Finnhub (${defaultFrom} to ${defaultTo})`);
    return events;
  } catch (error: any) {
    console.error(`❌ Error fetching IPO calendar from Finnhub:`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error code: ${error.code}`);
    
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response status text: ${error.response.statusText}`);
      console.error(`   Response headers:`, error.response.headers);
      console.error(`   Response data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error(`   Request was made but no response received`);
      console.error(`   Request details:`, error.request);
    }
    
    console.error(`   Full error:`, error);
    return cached || [];
  }
}

