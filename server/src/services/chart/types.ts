/**
 * Unified Chart Types
 * Common types for both stocks and crypto charts
 */

/**
 * Unified historical bar/candle data
 * Same structure for both stocks and crypto
 */
export interface HistoricalBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Chart data request parameters
 */
export interface ChartDataParams {
  symbol: string;
  timespan: 'day' | 'week' | 'month';
  limit: number;
}

/**
 * Chart data response
 */
export interface ChartDataResponse {
  symbol: string;
  type: 'crypto' | 'stock';
  bars: HistoricalBar[];
  name?: string;
}

