/**
 * Finnhub Service
 * Provides real-time stock quotes via WebSocket (15-minute delay on free tier)
 */
import WebSocket from 'ws';
import axios from 'axios';
import { env } from '../../config/env.js';
import type { StockQuote, MarketNews } from '../../types/index.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

// Cache for quotes
const cache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (matches free tier update frequency)

// WebSocket connection
let ws: WebSocket | null = null;
let subscribedSymbols = new Set<string>();
let reconnectTimeout: NodeJS.Timeout | null = null;
const RECONNECT_DELAY = 5000; // 5 seconds

// Callbacks for quote updates
const quoteCallbacks = new Map<string, (quote: StockQuote) => void>();

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
 * Initialize WebSocket connection to Finnhub
 */
function initWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!env.FINNHUB_API_KEY) {
      console.warn('⚠️ Finnhub API key not configured, WebSocket will not connect');
      resolve();
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(); // Already connected
      return;
    }

    // Clean up existing connection if any
    if (ws) {
      try {
        ws.removeAllListeners();
        ws.close();
      } catch (e) {
        // Ignore errors
      }
    }

    const url = `${FINNHUB_WS_URL}?token=${env.FINNHUB_API_KEY}`;
    console.log('🔌 Connecting to Finnhub WebSocket...');

    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    ws = new WebSocket(url);

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    ws.on('open', () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      console.log('✅ Connected to Finnhub WebSocket');

      // Subscribe to all pending symbols
      subscribedSymbols.forEach(symbol => {
        subscribeToSymbol(symbol);
      });

      console.log(`📊 Finnhub: Subscribed to ${subscribedSymbols.size} symbols: ${Array.from(subscribedSymbols).join(', ')}`);
      resolve();
    });

    ws.on('error', (error) => {
      cleanup();
      if (!resolved) {
        resolved = true;
        console.error('❌ Finnhub WebSocket error during init:', error);
        ws = null;
        reject(error);
      }
    });

    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('❌ Finnhub WebSocket connection timeout after 10 seconds');
        if (ws) {
          try {
            ws.removeAllListeners();
            ws.close();
          } catch (e) {
            // Ignore
          }
          ws = null;
        }
        reject(new Error('Finnhub WebSocket connection timeout'));
      }
    }, 10000);

    ws.on('close', (code, reason) => {
      console.log(`📴 Finnhub WebSocket closed: code=${code}, reason=${reason.toString() || 'none'}`);
      ws = null;

      // Reconnect after delay (only if we were connected)
      if (code === 1000 || code === 1001) {
        // Normal closure, don't reconnect immediately
        return;
      }

      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        console.log('🔄 Reconnecting to Finnhub WebSocket...');
        initWebSocket().catch((err) => {
          console.error('❌ Failed to reconnect Finnhub WebSocket:', err);
        });
      }, RECONNECT_DELAY);
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'trade') {
          // Finnhub sends trade data as array in message.data
          const tradeData = Array.isArray(message.data) ? message.data : [];
          if (tradeData.length > 0) {
            console.log(`📊 Finnhub received ${tradeData.length} trade updates`);
            handleTradeUpdate(tradeData);
          }
        } else if (message.type === 'ping') {
          // Respond to ping with pong
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (error) {
        console.error('Error parsing Finnhub WebSocket message:', error);
      }
    });
  });
}

/**
 * Subscribe to symbol updates
 */
function subscribeToSymbol(symbol: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const subscribeMessage = {
    type: 'subscribe',
    symbol: symbol.toUpperCase(),
  };

  ws.send(JSON.stringify(subscribeMessage));
  subscribedSymbols.add(symbol.toUpperCase());
  console.log(`📊 Subscribed to ${symbol} on Finnhub`);
}

/**
 * Unsubscribe from symbol updates
 */
function unsubscribeFromSymbol(symbol: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const unsubscribeMessage = {
    type: 'unsubscribe',
    symbol: symbol.toUpperCase(),
  };

  ws.send(JSON.stringify(unsubscribeMessage));
  subscribedSymbols.delete(symbol.toUpperCase());
  console.log(`📊 Unsubscribed from ${symbol} on Finnhub`);
}

/**
 * Handle trade update from WebSocket
 */
function handleTradeUpdate(data: any[]): void {
  console.log(`📊 Processing ${data.length} trade updates from Finnhub`);

  // Group trades by symbol and get the latest price for each
  const latestTrades = new Map<string, any>();

  data.forEach(trade => {
    const symbol = trade.s; // Finnhub uses 's' for symbol
    const existing = latestTrades.get(symbol);

    // Keep the trade with the latest timestamp
    if (!existing || trade.t > existing.t) {
      latestTrades.set(symbol, trade);
    }
  });

  console.log(`📊 Latest trades for symbols: ${Array.from(latestTrades.keys()).join(', ')}`);

  // Update cache and call callbacks
  latestTrades.forEach((trade, symbol) => {
    // Finnhub trade timestamp is in milliseconds
    const tradeTimestamp = trade.t;

    const quote: StockQuote = {
      symbol,
      price: trade.p, // Finnhub uses 'p' for price
      change: 0, // Will be calculated if we have previous close
      changePercent: 0,
      volume: trade.v || 0, // Finnhub uses 'v' for volume
      timestamp: tradeTimestamp,
    };

    // Try to calculate change from cached quote (if we have a previous close price)
    const cached = cache.get(symbol);
    if (cached && cached.data.price > 0) {
      quote.change = quote.price - cached.data.price;
      quote.changePercent = (quote.change / cached.data.price) * 100;
    }

    setCache(symbol, quote);

    // Call registered callbacks
    const callback = quoteCallbacks.get(symbol);
    if (callback) {
      console.log(`📡 Broadcasting Finnhub update for ${symbol}: $${quote.price.toFixed(2)} (+${quote.changePercent.toFixed(2)}%)`);
      callback(quote);
    }
  });
}

/**
 * Get stock quote via REST API (fallback)
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
    console.log(`✅ Fetched Finnhub quote for ${symbol}: $${quote.price.toFixed(2)} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
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
 * Subscribe to symbol updates via WebSocket
 */
export function subscribeToStock(symbol: string, callback: (quote: StockQuote) => void): void {
  const upperSymbol = symbol.toUpperCase();
  
  // Register callback
  quoteCallbacks.set(upperSymbol, callback);

  // Add to subscribed symbols list (will subscribe when WebSocket opens)
  subscribedSymbols.add(upperSymbol);

  // If WebSocket is already connected, subscribe immediately
  if (ws && ws.readyState === WebSocket.OPEN) {
    subscribeToSymbol(upperSymbol);
  }
  // If WebSocket doesn't exist or not open yet, it will subscribe when 'open' event fires
}

/**
 * Unsubscribe from symbol updates
 */
export function unsubscribeFromStock(symbol: string): void {
  const upperSymbol = symbol.toUpperCase();
  
  quoteCallbacks.delete(upperSymbol);
  
  // Only unsubscribe from WebSocket if no callbacks remain
  if (quoteCallbacks.size === 0 || !Array.from(quoteCallbacks.keys()).includes(upperSymbol)) {
    unsubscribeFromSymbol(upperSymbol);
  }
}

/**
 * Initialize Finnhub service (call on server startup)
 * Uses REST API polling instead of WebSocket for reliability
 */
export function initFinnhubService(): void {
  if (env.FINNHUB_API_KEY) {
    console.log('🚀 Initializing Finnhub service (REST API polling mode)...');
    // Don't use WebSocket - use REST API polling instead
    // WebSocket is unreliable and not necessary for 15-minute updates
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
    connected: ws !== null && ws.readyState === WebSocket.OPEN,
    subscribedCount: subscribedSymbols.size,
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

