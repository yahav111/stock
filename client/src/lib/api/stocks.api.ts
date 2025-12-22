/**
 * Stocks API
 * All stock-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';
import type { StockQuote, StockDetails, HistoricalBar } from '../../types';

// ===================
// Types
// ===================

export interface GetStocksParams {
  symbols: string[];
}

export interface GetHistoryParams {
  symbol: string;
  timespan?: 'day' | 'week' | 'month';
  limit?: number;
}

export interface SearchParams {
  q: string;
  limit?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// ===================
// API Functions
// ===================

/**
 * Get a single stock quote
 */
export async function getStock(symbol: string): Promise<StockQuote> {
  const response = await apiClient.get<ApiSuccessResponse<StockQuote>>(
    `/stocks/${symbol.toUpperCase()}`
  );
  return unwrapResponse(response.data);
}

/**
 * Get multiple stock quotes
 */
export async function getStocks(symbols: string[]): Promise<StockQuote[]> {
  const response = await apiClient.get<ApiSuccessResponse<StockQuote[]>>(
    '/stocks',
    { params: { symbols: symbols.join(',') } }
  );
  return unwrapResponse(response.data);
}

/**
 * Get default stock quotes
 */
export async function getDefaults(): Promise<StockQuote[]> {
  const response = await apiClient.get<ApiSuccessResponse<StockQuote[]>>(
    '/stocks/defaults'
  );
  return unwrapResponse(response.data);
}

/**
 * Get stock historical data
 */
export async function getHistory(params: GetHistoryParams): Promise<HistoricalBar[]> {
  const { symbol, timespan = 'day', limit = 100 } = params;
  const response = await apiClient.get<ApiSuccessResponse<HistoricalBar[]>>(
    `/stocks/${symbol.toUpperCase()}/history`,
    { params: { timespan, limit } }
  );
  return unwrapResponse(response.data);
}

/**
 * Get stock details
 */
export async function getDetails(symbol: string): Promise<StockDetails> {
  const response = await apiClient.get<ApiSuccessResponse<StockDetails>>(
    `/stocks/${symbol.toUpperCase()}/details`
  );
  return unwrapResponse(response.data);
}

/**
 * Search for stocks
 */
export async function search(params: SearchParams): Promise<SearchResult[]> {
  const response = await apiClient.get<ApiSuccessResponse<SearchResult[]>>(
    '/stocks/search',
    { params }
  );
  return unwrapResponse(response.data);
}

// Export as namespace for easier imports
export const stocksApi = {
  getStock,
  getStocks,
  getDefaults,
  getHistory,
  getDetails,
  search,
};

