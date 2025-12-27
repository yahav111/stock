/**
 * Twelve Data API Service
 * Forex data provider with in-memory caching
 */
import axios from 'axios';
import { env } from '../../config/env.js';
import type { HistoricalBar } from '../chart/types.js';

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// In-memory cache with 5-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<HistoricalBar[]>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data if it exists and is still valid
 */
function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Set data in cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get forex historical data from Twelve Data
 * Always fetches USD/{symbol} pair
 * @param symbol - Currency symbol (e.g., 'JPY', 'EUR')
 * @param interval - '1day' or '1week'
 * @returns Array of historical bars
 */
export async function getForexHistory(
  symbol: string,
  interval: '1day' | '1week' = '1day'
): Promise<HistoricalBar[]> {
  // Normalize symbol (remove USD prefix if present)
  const cleanSymbol = symbol.toUpperCase().replace(/^USD\//, '').trim();
  const pair = `USD/${cleanSymbol}`;
  
  // Create cache key
  const cacheKey = `forex:${pair}:${interval}`;
  
  // Check cache
  const cached = getCached<HistoricalBar[]>(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for ${pair} (${interval})`);
    return cached;
  }

  if (!env.TWELVE_DATA_API_KEY) {
    console.warn('⚠️ Twelve Data API key not configured');
    throw new Error('Twelve Data API key not configured');
  }

  try {
    console.log(`📡 Fetching forex data from Twelve Data: ${pair} (${interval})`);
    
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
      params: {
        symbol: pair,
        interval,
        outputsize: 500,
        apikey: env.TWELVE_DATA_API_KEY,
        format: 'JSON',
      },
      timeout: 10000,
    });

    // Check for error response from Twelve Data API
    if (response.data.status === 'error') {
      const errorMsg = response.data.message || 'Twelve Data API error';
      console.error(`❌ Twelve Data API error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Log the response structure for debugging
    console.log(`📊 Twelve Data API response structure:`, {
      hasValues: !!response.data.values,
      isValuesArray: Array.isArray(response.data.values),
      keys: Object.keys(response.data),
      dataType: typeof response.data,
    });

    // Twelve Data API can return data in different formats
    // Try response.data.values first (standard format)
    let values = response.data.values;
    
    // If values doesn't exist, maybe the data is structured differently
    // Some endpoints return data directly as an array
    if (!values && Array.isArray(response.data)) {
      values = response.data;
    }
    
    // If still no values, check if it's an object with a data property
    if (!values && response.data.data && Array.isArray(response.data.data)) {
      values = response.data.data;
    }

    if (!values || !Array.isArray(values)) {
      console.error('❌ Invalid response format from Twelve Data API. Full response:', JSON.stringify(response.data, null, 2).substring(0, 1000));
      throw new Error('Invalid response format from Twelve Data API - expected values array');
    }

    // Transform Twelve Data format to HistoricalBar
    // Twelve Data returns data in reverse chronological order (newest first)
    const bars: HistoricalBar[] = values
      .map((item: any, index: number) => {
        try {
          // Handle different possible field names
          const datetime = item.datetime || item.date || item.time;
          const open = parseFloat(item.open || item.o || 0);
          const high = parseFloat(item.high || item.h || 0);
          const low = parseFloat(item.low || item.l || 0);
          const close = parseFloat(item.close || item.c || 0);
          const volume = parseFloat(item.volume || item.v || '0');

          if (!datetime) {
            console.warn(`⚠️ Item at index ${index} missing datetime field:`, item);
            return null;
          }

          // Parse datetime - can be ISO string or timestamp
          let timestamp: number;
          if (typeof datetime === 'string') {
            timestamp = new Date(datetime).getTime() / 1000;
          } else if (typeof datetime === 'number') {
            // If it's already a timestamp, convert from milliseconds to seconds if needed
            timestamp = datetime > 1e12 ? datetime / 1000 : datetime;
          } else {
            console.warn(`⚠️ Item at index ${index} has invalid datetime:`, datetime);
            return null;
          }

          if (isNaN(timestamp) || isNaN(close)) {
            console.warn(`⚠️ Item at index ${index} has invalid numeric values:`, item);
            return null;
          }

          return {
            time: timestamp,
            open,
            high,
            low,
            close,
            volume,
          };
        } catch (err: any) {
          console.warn(`⚠️ Error processing item at index ${index}:`, err.message, item);
          return null;
        }
      })
      .filter((bar): bar is HistoricalBar => bar !== null && !isNaN(bar.time) && !isNaN(bar.close))
      .reverse(); // Reverse to chronological order (oldest first)

    // Cache the result
    setCache(cacheKey, bars);

    console.log(`✅ Fetched ${bars.length} bars for ${pair} (${interval})`);
    return bars;
  } catch (error: any) {
    // Log full error details for debugging
    console.error(`❌ Error fetching forex data for ${pair}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded for Twelve Data API');
    }
    
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorMessage = error.response?.data?.message || `Invalid currency pair: ${pair}`;
      throw new Error(errorMessage);
    }

    // Include more details in error message
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to fetch forex data for ${pair}: ${errorMessage}`);
  }
}

/**
 * Get forex quote (latest price)
 * @param symbol - Currency symbol (e.g., 'JPY', 'EUR')
 * @returns Current forex rate
 */
export async function getForexQuote(symbol: string): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  name?: string;
} | null> {
  const cleanSymbol = symbol.toUpperCase().replace(/^USD\//, '').trim();
  const pair = `USD/${cleanSymbol}`;

  try {
    // Use 1day interval and get the latest value
    const bars = await getForexHistory(cleanSymbol, '1day');
    
    if (bars.length === 0) {
      return null;
    }

    const latestBar = bars[bars.length - 1];
    const previousBar = bars.length > 1 ? bars[bars.length - 2] : latestBar;

    const change = latestBar.close - previousBar.close;
    const changePercent = previousBar.close !== 0 
      ? (change / previousBar.close) * 100 
      : 0;

    return {
      symbol: cleanSymbol,
      price: latestBar.close,
      change,
      changePercent,
      volume: latestBar.volume,
      timestamp: latestBar.time * 1000, // Convert to milliseconds
      name: `${pair} Exchange Rate`,
    };
  } catch (error: any) {
    console.error(`❌ Error fetching forex quote for ${pair}:`, error.message);
    return null;
  }
}

