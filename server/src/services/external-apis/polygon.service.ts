import axios from 'axios';
import { env } from '../../config/env.js';
import type { Stock, StockQuote } from '../../types/index.js';

const POLYGON_BASE_URL = 'https://api.polygon.io';

// In-memory cache with longer TTL to reduce API calls
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 120000; // 2 minutes for quotes
const CACHE_TTL_HISTORY = 60 * 60 * 1000; // 1 hour for historical data (it doesn't change often)

// Rate limiter - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 15000; // 15 seconds between requests (4 per minute max)

function getCached<T>(key: string, ttl: number = CACHE_TTL): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    // Additional check: if it's historical data, verify the last bar is recent
    const data = cached.data as any;
    if (Array.isArray(data) && data.length > 0 && data[0].time) {
      // This is historical bar data
      const lastBarTime = data[data.length - 1].time * 1000; // Convert to ms
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      
      if (lastBarTime < threeDaysAgo) {
        // Cache is stale - last bar is older than 3 days
        console.log(`⚠️ Cache for ${key} is stale (last bar: ${new Date(lastBarTime).toISOString().split('T')[0]}), invalidating...`);
        cache.delete(key);
        return null;
      }
    }
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Rate limit: waiting ${waitTime}ms before next Polygon request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const cacheKey = `stock:${symbol}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for ${symbol}`);
    return cached;
  }

  if (!env.POLYGON_API_KEY) {
    console.warn('Polygon API key not configured, returning mock data');
    return getMockStockQuote(symbol);
  }

  try {
    await waitForRateLimit();
    
    const response = await axios.get(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`,
      {
        params: { apiKey: env.POLYGON_API_KEY },
        timeout: 10000,
      }
    );

    const result = response.data.results?.[0];
    if (!result) return getMockStockQuote(symbol);

    const quote: StockQuote = {
      symbol,
      price: result.c, // close price
      change: result.c - result.o,
      changePercent: ((result.c - result.o) / result.o) * 100,
      volume: result.v,
      timestamp: result.t,
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 429) {
      console.warn(`⚠️ Rate limited by Polygon, using mock data for ${symbol}`);
    } else {
      console.error(`Error fetching stock quote for ${symbol}:`, error);
    }
    return getMockStockQuote(symbol);
  }
}

// Use Polygon's grouped daily endpoint to get all stocks in ONE request
export async function getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  // Check cache first for all symbols
  const cachedQuotes: StockQuote[] = [];
  const uncachedSymbols: string[] = [];

  for (const symbol of symbols) {
    const cached = getCached<StockQuote>(`stock:${symbol}`);
    if (cached) {
      cachedQuotes.push(cached);
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  // If all cached, return immediately
  if (uncachedSymbols.length === 0) {
    console.log(`📦 All ${symbols.length} stocks from cache`);
    return cachedQuotes;
  }

  // If no API key, return mock data
  if (!env.POLYGON_API_KEY) {
    console.warn('Polygon API key not configured, using mock data');
    return symbols.map(getMockStockQuote);
  }

  try {
    await waitForRateLimit();

    // Use grouped daily endpoint - ONE request for ALL stocks
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // Skip weekends
    while (yesterday.getDay() === 0 || yesterday.getDay() === 6) {
      yesterday.setDate(yesterday.getDate() - 1);
    }
    const dateStr = yesterday.toISOString().split('T')[0];

    console.log(`📡 Fetching grouped daily data for ${dateStr}`);
    
    const response = await axios.get(
      `${POLYGON_BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${dateStr}`,
      {
        params: { 
          apiKey: env.POLYGON_API_KEY,
          adjusted: true,
        },
        timeout: 15000,
      }
    );

    const results = response.data.results || [];
    const quotesMap = new Map<string, StockQuote>();

    for (const result of results) {
      if (symbols.includes(result.T)) {
        const quote: StockQuote = {
          symbol: result.T,
          price: result.c,
          change: result.c - result.o,
          changePercent: ((result.c - result.o) / result.o) * 100,
          volume: result.v,
          timestamp: result.t || Date.now(),
        };
        quotesMap.set(result.T, quote);
        setCache(`stock:${result.T}`, quote);
      }
    }

    // Combine cached and fetched quotes
    const allQuotes: StockQuote[] = [...cachedQuotes];
    for (const symbol of uncachedSymbols) {
      const quote = quotesMap.get(symbol);
      if (quote) {
        allQuotes.push(quote);
      } else {
        // If not found in API response, use mock
        allQuotes.push(getMockStockQuote(symbol));
      }
    }

    console.log(`✅ Got ${quotesMap.size} stocks from API, ${cachedQuotes.length} from cache`);
    return allQuotes;

  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 429) {
      console.warn('⚠️ Rate limited by Polygon, using mock data for all stocks');
    } else {
      console.error('Error fetching multiple stock quotes:', error);
    }
    // Return cached + mock for uncached
    return [
      ...cachedQuotes,
      ...uncachedSymbols.map(getMockStockQuote),
    ];
  }
}

export async function getStockDetails(symbol: string): Promise<Stock | null> {
  const cacheKey = `stock-details:${symbol}`;
  const cached = getCached<Stock>(cacheKey);
  if (cached) return cached;

  if (!env.POLYGON_API_KEY) {
    return getMockStock(symbol);
  }

  try {
    await waitForRateLimit();
    
    // Get ticker details
    const [detailsRes, quoteRes] = await Promise.all([
      axios.get(`${POLYGON_BASE_URL}/v3/reference/tickers/${symbol}`, {
        params: { apiKey: env.POLYGON_API_KEY },
        timeout: 10000,
      }),
      axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`, {
        params: { apiKey: env.POLYGON_API_KEY },
        timeout: 10000,
      }),
    ]);

    const details = detailsRes.data.results;
    const quote = quoteRes.data.results?.[0];

    if (!details || !quote) return getMockStock(symbol);

    const stock: Stock = {
      symbol,
      name: details.name,
      price: quote.c,
      change: quote.c - quote.o,
      changePercent: ((quote.c - quote.o) / quote.o) * 100,
      volume: quote.v,
      marketCap: details.market_cap || 0,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.c,
      timestamp: quote.t,
    };

    setCache(cacheKey, stock);
    return stock;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 429) {
      console.warn(`⚠️ Rate limited, using mock data for ${symbol}`);
    } else {
      console.error(`Error fetching stock details for ${symbol}:`, error);
    }
    return getMockStock(symbol);
  }
}

// Historical OHLC data type
export interface HistoricalBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Polygon API response types
interface PolygonBarData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface PolygonHistoryResponse {
  results?: PolygonBarData[];
  next_url?: string;
}

// Get historical stock data (candlestick/OHLC)
export async function getStockHistory(
  symbol: string, 
  timespan: 'day' | 'week' | 'month' = 'day',
  limit: number = 100
): Promise<HistoricalBar[]> {
  // Dynamic cache key with date to ensure daily refresh
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `history:${symbol}:${timespan}:${limit}:${today}`;
  
  // Check cache, but also verify it's not stale
  const cached = getCached<HistoricalBar[]>(cacheKey, CACHE_TTL_HISTORY);
  if (cached && cached.length > 0) {
    // Verify the last bar is recent (within last 3 days)
    const lastBarTime = cached[cached.length - 1].time * 1000; // Convert to ms
    const lastBarDate = new Date(lastBarTime).toISOString().split('T')[0];
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const threeDaysAgoDate = new Date(threeDaysAgo).toISOString().split('T')[0];
    
    console.log(`🔍 Cache check for ${symbol}: last bar date=${lastBarDate}, 3 days ago=${threeDaysAgoDate}, today=${today}`);
    
    if (lastBarTime > threeDaysAgo) {
      console.log(`📦 Cache hit for ${symbol} history (dated cache, last bar: ${lastBarDate})`);
      return cached;
    } else {
      console.log(`⚠️ Cache exists but is stale (last bar: ${lastBarDate} is older than ${threeDaysAgoDate}), refetching...`);
      // Cache is stale, continue to fetch fresh data
    }
  } else {
    console.log(`📭 No cache found for ${symbol} (key: ${cacheKey}), fetching from API...`);
  }

  if (!env.POLYGON_API_KEY) {
    console.warn('Polygon API key not configured, returning mock history');
    return getMockHistory(symbol, limit, timespan);
  }

  try {
    await waitForRateLimit();

    // Calculate dynamic date range - always use current date
    const to = new Date();
    const from = new Date();
    
    // For stocks: find the most recent completed trading day
    // Stock markets are typically closed on weekends
    // If today is a weekday, we might want to include today's data if market is open
    // But for historical data, we'll use yesterday as a safe default
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Start from yesterday (most recent completed day)
    to.setDate(to.getDate() - 1);
    let weekdayAttempts = 0;
    while ((to.getDay() === 0 || to.getDay() === 6) && weekdayAttempts < 7) {
      to.setDate(to.getDate() - 1);
      weekdayAttempts++;
    }
    to.setHours(23, 59, 59, 999);
    
    // Log for debugging
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const toDateStr = to.toISOString().split('T')[0];
    console.log(`📅 Today: ${now.toISOString().split('T')[0]} (${dayNames[currentDay]}), Requesting up to: ${toDateStr} (${dayNames[to.getDay()]})`);
    
    // Calculate 'from' dynamically based on timespan
    if (timespan === 'day') {
      // Go back 'limit' trading days + buffer for weekends
      const extraDays = Math.ceil(limit * 0.3); // ~30% extra for weekends
      from.setDate(from.getDate() - limit - extraDays);
    } else if (timespan === 'week') {
      // Go back 'limit' weeks
      from.setDate(from.getDate() - (limit * 7));
    } else if (timespan === 'month') {
      // Go back 'limit' months
      from.setMonth(from.getMonth() - limit);
    }
    from.setHours(0, 0, 0, 0);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log(`📡 Fetching ${symbol} history: ${timespan} from ${fromStr} to ${toStr}`);
    console.log(`   Today is: ${currentDate}, Requesting up to: ${toStr} (most recent trading day)`);

    // Fetch data with pagination (Polygon free tier returns limited results per request)
    let allResults: PolygonBarData[] = [];
    let nextUrl: string | null = `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${timespan}/${fromStr}/${toStr}?apiKey=${env.POLYGON_API_KEY}&adjusted=true&sort=asc&limit=${Math.min(limit, 50)}`;
    let attempts = 0;
    const maxAttempts = 5; // Limit pagination to avoid rate limiting

    let paginationAttempts = 0;
    while (nextUrl && allResults.length < limit && paginationAttempts < maxAttempts) {
      paginationAttempts++;
      await waitForRateLimit();
      
      const apiRes = await axios.get(nextUrl, { timeout: 15000 });
      const data = apiRes.data as PolygonHistoryResponse;
      const results = data.results || [];
      
      if (results.length > 0) {
        const firstResultDate = new Date(results[0].t).toISOString().split('T')[0];
        const lastResultDate = new Date(results[results.length - 1].t).toISOString().split('T')[0];
        console.log(`📊 Page ${paginationAttempts}: Got ${results.length} bars (${firstResultDate} to ${lastResultDate}), total: ${allResults.length + results.length}`);
      } else {
        console.log(`📊 Page ${paginationAttempts}: Got 0 bars (no data in this range)`);
      }
      
      allResults = [...allResults, ...results];
      
      // Get next page URL if available
      nextUrl = data.next_url ? `${data.next_url}&apiKey=${env.POLYGON_API_KEY}` : null;
      
      // Break early if we have enough
      if (allResults.length >= limit) break;
    }
    
    if (allResults.length === 0) {
      console.warn(`No history data for ${symbol}, using mock`);
      return getMockHistory(symbol, limit, timespan);
    }

    // Polygon returns data sorted by time (ascending), so the LAST bars are the most recent
    // We want the most recent 'limit' bars, so take from the end
    const sortedResults = allResults.sort((a, b) => a.t - b.t); // Ensure sorted by time
    const finalResults = sortedResults.slice(-limit); // Take last 'limit' bars (most recent)
    
    if (finalResults.length > 0) {
      const oldestBar = new Date(finalResults[0].t).toISOString().split('T')[0];
      const newestBar = new Date(finalResults[finalResults.length - 1].t).toISOString().split('T')[0];
      console.log(`📊 Selected ${finalResults.length} most recent bars: ${oldestBar} to ${newestBar}`);
    }

    const history: HistoricalBar[] = finalResults.map((bar) => ({
      time: Math.floor(bar.t / 1000), // Convert ms to seconds
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    // Log the date range of fetched data
    if (history.length > 0) {
      const firstBarDate = new Date(history[0].time * 1000).toISOString().split('T')[0];
      const lastBarDate = new Date(history[history.length - 1].time * 1000).toISOString().split('T')[0];
      console.log(`✅ Got ${history.length} bars for ${symbol} (from ${paginationAttempts} API calls)`);
      console.log(`   Date range: ${firstBarDate} to ${lastBarDate}`);
      console.log(`   Requested range: ${fromStr} to ${toStr}`);
    }
    
    setCache(cacheKey, history);
    return history;

  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 429) {
      console.warn(`⚠️ Rate limited, using mock history for ${symbol}`);
    } else {
      console.error(`Error fetching history for ${symbol}:`, error);
    }
    return getMockHistory(symbol, limit, timespan);
  }
}

// Generate mock historical data
function getMockHistory(symbol: string, count: number, timespan: 'day' | 'week' | 'month' = 'day'): HistoricalBar[] {
  const mockPrices: Record<string, number> = {
    AAPL: 272, GOOGL: 175, MSFT: 430, TSLA: 250, AMZN: 195,
    NVDA: 140, META: 580, NFLX: 900, AMD: 125, INTC: 20,
  };
  
  // Calculate interval in seconds based on timespan
  const intervalSeconds = {
    day: 24 * 60 * 60,           // 1 day
    week: 7 * 24 * 60 * 60,      // 1 week
    month: 30 * 24 * 60 * 60,    // ~1 month
  }[timespan];
  
  const history: HistoricalBar[] = [];
  let price = (mockPrices[symbol] || 100) * 0.85; // Start 15% lower
  
  // Always use current date - no hardcoded dates
  // Start from the most recent COMPLETED trading day (yesterday at market close)
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1); // Yesterday
  // Skip weekends for stocks
  while (endDate.getDay() === 0 || endDate.getDay() === 6) {
    endDate.setDate(endDate.getDate() - 1);
  }
  endDate.setHours(16, 0, 0, 0); // 4 PM market close
  
  const endTime = Math.floor(endDate.getTime() / 1000);
  const baseTime = endTime - (count - 1) * intervalSeconds;
  
  console.log(`📊 Generating mock history: ${new Date(baseTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`);
  
  for (let i = 0; i < count; i++) {
    const time = baseTime + i * intervalSeconds;
    const changePercent = timespan === 'day' ? 0.03 : timespan === 'week' ? 0.06 : 0.10;
    const dailyChange = (Math.random() - 0.48) * (price * changePercent);
    const open = price;
    const close = price + dailyChange;
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    
    history.push({ time, open, high, low, close, volume: Math.floor(Math.random() * 50000000) });
    price = close;
  }
  
  return history;
}

// Mock data for development / when rate limited
function getMockStockQuote(symbol: string): StockQuote {
  const mockPrices: Record<string, number> = {
    AAPL: 178.52,
    GOOGL: 141.80,
    MSFT: 374.58,
    TSLA: 248.48,
    AMZN: 178.25,
    NVDA: 467.32,
    META: 353.96,
    NFLX: 485.23,
    AMD: 125.67,
    INTC: 43.21,
  };

  const basePrice = mockPrices[symbol] || 100 + Math.random() * 200;
  // Add small random variation to make it look "live"
  const variation = (Math.random() - 0.5) * 2;
  const price = basePrice + variation;
  const change = (Math.random() - 0.5) * 10;

  return {
    symbol,
    price,
    change,
    changePercent: (change / price) * 100,
    volume: Math.floor(Math.random() * 10000000),
    timestamp: Date.now(),
  };
}

function getMockStock(symbol: string): Stock {
  const quote = getMockStockQuote(symbol);
  const mockNames: Record<string, string> = {
    AAPL: 'Apple Inc.',
    GOOGL: 'Alphabet Inc.',
    MSFT: 'Microsoft Corporation',
    TSLA: 'Tesla, Inc.',
    AMZN: 'Amazon.com, Inc.',
    NVDA: 'NVIDIA Corporation',
    META: 'Meta Platforms, Inc.',
    NFLX: 'Netflix, Inc.',
    AMD: 'Advanced Micro Devices, Inc.',
    INTC: 'Intel Corporation',
  };

  return {
    ...quote,
    name: mockNames[symbol] || symbol,
    marketCap: Math.floor(Math.random() * 1000000000000),
    high: quote.price * 1.02,
    low: quote.price * 0.98,
    open: quote.price - quote.change,
    previousClose: quote.price - quote.change,
  };
}

// Search results type
export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// Search for stocks
export async function searchStocks(query: string, limit: number = 10): Promise<StockSearchResult[]> {
  if (!env.POLYGON_API_KEY) {
    return getMockSearchResults(query, limit);
  }

  try {
    await waitForRateLimit();
    
    const response = await axios.get(
      `${POLYGON_BASE_URL}/v3/reference/tickers`,
      {
        params: { 
          apiKey: env.POLYGON_API_KEY,
          search: query,
          active: true,
          limit: limit,
          market: 'stocks',
        },
        timeout: 10000,
      }
    );

    const results = response.data.results || [];
    return results.map((ticker: any) => ({
      symbol: ticker.ticker,
      name: ticker.name,
      type: ticker.type || 'Stock',
      exchange: ticker.primary_exchange || ticker.exchange || 'Unknown',
    }));
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 429) {
      console.warn('⚠️ Rate limited, using mock search results');
    } else {
      console.error('Error searching stocks:', error);
    }
    return getMockSearchResults(query, limit);
  }
}

function getMockSearchResults(query: string, limit: number): StockSearchResult[] {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'Stock', exchange: 'NASDAQ' },
  ];

  const filtered = mockStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, limit);
}
