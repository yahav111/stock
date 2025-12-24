/**
 * Finnhub Service
 * Provides stock quotes and market news via REST API
 * Uses polling every 1 minute (60 requests/minute limit on free tier)
 */
import axios from 'axios';
import { env } from '../../config/env.js';
import type { StockQuote, MarketNews } from '../../types/index.js';

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

