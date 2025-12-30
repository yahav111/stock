/**
 * Crypto API
 * All cryptocurrency-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';
import type { Cryptocurrency } from '../../types';

// ===================
// Types
// ===================

export interface GetCryptosParams {
  symbols: string[];
}

export interface SearchParams {
  q: string;
  limit?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
}

// ===================
// API Functions
// ===================

/**
 * Get a single cryptocurrency price
 */
export async function getCrypto(symbol: string): Promise<Cryptocurrency> {
  const response = await apiClient.get<ApiSuccessResponse<Cryptocurrency>>(
    `/crypto/${symbol.toUpperCase()}`
  );
  return unwrapResponse(response.data);
}

/**
 * Get multiple cryptocurrency prices
 */
export async function getCryptos(symbols: string[]): Promise<Cryptocurrency[]> {
  const response = await apiClient.get<ApiSuccessResponse<Cryptocurrency[]>>(
    '/crypto',
    { params: { symbols: symbols.join(',') } }
  );
  return unwrapResponse(response.data);
}

/**
 * Get default cryptocurrency prices
 */
export async function getDefaults(): Promise<Cryptocurrency[]> {
  const response = await apiClient.get<ApiSuccessResponse<Cryptocurrency[]>>(
    '/crypto/defaults'
  );
  return unwrapResponse(response.data);
}

/**
 * Search for cryptocurrencies
 */
export async function search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult[]> {
  const response = await apiClient.get<ApiSuccessResponse<SearchResult[]>>(
    '/crypto/search',
    { params, signal }
  );
  return unwrapResponse(response.data);
}

// Export as namespace
export const cryptoApi = {
  getCrypto,
  getCryptos,
  getDefaults,
  search,
};

