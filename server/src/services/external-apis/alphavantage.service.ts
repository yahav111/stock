/**
 * Alpha Vantage Forex Service
 * Provides intraday and daily Forex data for USD/ILS
 */

import axios from 'axios';
import { env } from '../../config/env.js';
import type { CurrencyRate } from '../../types/index.js';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const RATE_LIMIT_DELAY = 12000; // 12 seconds between requests (5 per minute limit)

// Daily cache for intraday data (last 24 hours, 5-minute intervals)
interface IntradayDataPoint {
  time: string; // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

let dailyCache: IntradayDataPoint[] = [];
let lastFetchTime: number = 0;
let lastRate: number = 0; // Last known rate for fallback
let isRateLimited: boolean = false;

/**
 * Wait for rate limit cooldown
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastFetchTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`⏳ [ALPHA VANTAGE] Rate limit: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastFetchTime = Date.now();
}

/**
 * Fetch intraday Forex data (FX_INTRADAY endpoint)
 * Returns last 24 hours of 5-minute interval data
 */
export async function getIntradayForex(
  fromSymbol: string = 'USD',
  toSymbol: string = 'ILS',
  interval: string = '5min'
): Promise<IntradayDataPoint[]> {
  if (!env.ALPHA_VANTAGE_API_KEY) {
    console.warn('⚠️ [ALPHA VANTAGE] API key not configured, using cached/mock data');
    return dailyCache.length > 0 ? dailyCache : getMockIntradayData();
  }

  // If rate limited, return cached data
  if (isRateLimited) {
    console.warn('⚠️ [ALPHA VANTAGE] Rate limited, using cached data');
    return dailyCache.length > 0 ? dailyCache : getMockIntradayData();
  }

  try {
    await waitForRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'FX_INTRADAY',
        from_symbol: fromSymbol,
        to_symbol: toSymbol,
        interval: interval,
        apikey: env.ALPHA_VANTAGE_API_KEY,
        datatype: 'json',
      },
      timeout: 15000,
    });

    // Check for rate limit error
    if (response.data['Note'] || response.data['Information']) {
      const errorMsg = response.data['Note'] || response.data['Information'];
      if (errorMsg.includes('API call frequency') || errorMsg.includes('rate limit')) {
        isRateLimited = true;
        console.warn('⚠️ [ALPHA VANTAGE] Rate limit reached:', errorMsg);
        // Reset rate limit flag after 1 minute
        setTimeout(() => {
          isRateLimited = false;
          console.log('✅ [ALPHA VANTAGE] Rate limit cooldown expired');
        }, 60000);
        return dailyCache.length > 0 ? dailyCache : getMockIntradayData();
      }
    }

    // Check for error in response
    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    const timeSeries = response.data[`Time Series FX (${interval})`];
    if (!timeSeries) {
      console.warn('⚠️ [ALPHA VANTAGE] No time series data in response');
      return dailyCache.length > 0 ? dailyCache : getMockIntradayData();
    }

    // Convert to array format and filter last 24 hours
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const dataPoints: IntradayDataPoint[] = Object.entries(timeSeries)
      .map(([time, data]: [string, any]) => {
        const timestamp = new Date(time).getTime();
        // Only include last 24 hours
        if (timestamp < twentyFourHoursAgo) return null;
        
        return {
          time: new Date(time).toISOString(),
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
        };
      })
      .filter((point): point is IntradayDataPoint => point !== null)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Update cache
    dailyCache = dataPoints;
    
    // Update last known rate (use latest close price)
    if (dataPoints.length > 0) {
      lastRate = dataPoints[dataPoints.length - 1].close;
    }

    console.log(`✅ [ALPHA VANTAGE] Fetched ${dataPoints.length} intraday data points for ${fromSymbol}/${toSymbol}`);
    return dataPoints;
  } catch (error: any) {
    console.error(`❌ [ALPHA VANTAGE] Error fetching intraday data:`, error.message || error);
    
    // Return cached data if available
    if (dailyCache.length > 0) {
      console.log('📦 [ALPHA VANTAGE] Returning cached data due to error');
      return dailyCache;
    }
    
    return getMockIntradayData();
  }
}

/**
 * Fetch daily Forex data (FX_DAILY endpoint)
 * Returns last 7 days of closing prices for weekly chart
 */
export async function getDailyForex(
  fromSymbol: string = 'USD',
  toSymbol: string = 'ILS'
): Promise<Array<{ date: string; close: number }>> {
  if (!env.ALPHA_VANTAGE_API_KEY) {
    console.warn('⚠️ [ALPHA VANTAGE] API key not configured, using mock data');
    return getMockDailyData();
  }

  if (isRateLimited) {
    console.warn('⚠️ [ALPHA VANTAGE] Rate limited, using mock data for daily');
    return getMockDailyData();
  }

  try {
    await waitForRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'FX_DAILY',
        from_symbol: fromSymbol,
        to_symbol: toSymbol,
        apikey: env.ALPHA_VANTAGE_API_KEY,
        datatype: 'json',
      },
      timeout: 15000,
    });

    // Check for rate limit
    if (response.data['Note'] || response.data['Information']) {
      const errorMsg = response.data['Note'] || response.data['Information'];
      if (errorMsg.includes('API call frequency') || errorMsg.includes('rate limit')) {
        isRateLimited = true;
        setTimeout(() => { isRateLimited = false; }, 60000);
        return getMockDailyData();
      }
    }

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    const timeSeries = response.data['Time Series FX (Daily)'];
    if (!timeSeries) {
      return getMockDailyData();
    }

    // Get last 7 days
    const dailyData = Object.entries(timeSeries)
      .slice(0, 7)
      .map(([date, data]: [string, any]) => ({
        date,
        close: parseFloat(data['4. close']),
      }))
      .reverse(); // Oldest to newest

    console.log(`✅ [ALPHA VANTAGE] Fetched ${dailyData.length} daily data points for ${fromSymbol}/${toSymbol}`);
    return dailyData;
  } catch (error: any) {
    console.error(`❌ [ALPHA VANTAGE] Error fetching daily data:`, error.message || error);
    return getMockDailyData();
  }
}

/**
 * Get current exchange rate (latest from intraday cache)
 */
export function getCurrentRate(): number {
  if (dailyCache.length > 0) {
    return dailyCache[dailyCache.length - 1].close;
  }
  return lastRate || 3.7; // Fallback to mock rate
}

/**
 * Get intraday cache (for direct access)
 */
export function getIntradayCache(): IntradayDataPoint[] {
  return dailyCache;
}

/**
 * Format data for Recharts
 * Returns array with { time, value } format for line charts
 */
export function formatForRecharts(data: IntradayDataPoint[]): Array<{ time: number; value: number }> {
  return data.map(point => ({
    time: new Date(point.time).getTime(),
    value: point.close,
  }));
}

/**
 * Format daily data for Recharts
 */
export function formatDailyForRecharts(data: Array<{ date: string; close: number }>): Array<{ time: number; value: number }> {
  return data.map(point => ({
    time: new Date(point.date).getTime(),
    value: point.close,
  }));
}

/**
 * Get CurrencyRate format for WebSocket broadcast
 */
export function getCurrencyRateForBroadcast(): CurrencyRate {
  const currentRate = getCurrentRate();
  const previousRate = dailyCache.length > 1 ? dailyCache[dailyCache.length - 2].close : currentRate;
  const change = currentRate - previousRate;
  const changePercent = previousRate > 0 ? (change / previousRate) * 100 : 0;

  return {
    base: 'USD',
    target: 'ILS',
    rate: currentRate,
    change,
    changePercent,
    timestamp: Date.now(),
  };
}

// Mock data generators
function getMockIntradayData(): IntradayDataPoint[] {
  const data: IntradayDataPoint[] = [];
  const now = Date.now();
  const baseRate = 3.7;
  
  // Generate 24 hours of 5-minute intervals (288 data points)
  for (let i = 287; i >= 0; i--) {
    const time = new Date(now - (i * 5 * 60 * 1000));
    const variation = (Math.random() - 0.5) * 0.1;
    const rate = baseRate + variation;
    
    data.push({
      time: time.toISOString(),
      open: rate,
      high: rate + Math.random() * 0.05,
      low: rate - Math.random() * 0.05,
      close: rate + (Math.random() - 0.5) * 0.02,
    });
  }
  
  return data;
}

function getMockDailyData(): Array<{ date: string; close: number }> {
  const data: Array<{ date: string; close: number }> = [];
  const baseRate = 3.7;
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      close: baseRate + (Math.random() - 0.5) * 0.2,
    });
  }
  
  return data;
}

