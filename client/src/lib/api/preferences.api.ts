/**
 * Preferences API
 * All user preferences-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';

// ===================
// Types
// ===================

export interface UserPreferences {
  watchlistStocks: string[];
  watchlistCrypto: string[];
  favoriteCurrencies: string[];
  theme: 'light' | 'dark' | 'system';
  defaultChart: 'candlestick' | 'line' | 'area';
  defaultTimeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
}

export interface UpdatePreferencesParams {
  watchlistStocks?: string[];
  watchlistCrypto?: string[];
  favoriteCurrencies?: string[];
  theme?: 'light' | 'dark' | 'system';
  defaultChart?: 'candlestick' | 'line' | 'area';
  defaultTimeframe?: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
}

export interface WatchlistUpdateParams {
  add?: string[];
  remove?: string[];
}

// ===================
// API Functions
// ===================

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<UserPreferences> {
  const response = await apiClient.get<ApiSuccessResponse<UserPreferences>>(
    '/preferences'
  );
  return unwrapResponse(response.data);
}

/**
 * Update all preferences
 */
export async function updatePreferences(params: UpdatePreferencesParams): Promise<UserPreferences> {
  const response = await apiClient.put<ApiSuccessResponse<UserPreferences>>(
    '/preferences',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferences(): Promise<UserPreferences> {
  const response = await apiClient.delete<ApiSuccessResponse<UserPreferences>>(
    '/preferences'
  );
  return unwrapResponse(response.data);
}

/**
 * Update stock watchlist (add/remove)
 */
export async function updateStockWatchlist(params: WatchlistUpdateParams): Promise<{ watchlistStocks: string[] }> {
  const response = await apiClient.patch<ApiSuccessResponse<{ watchlistStocks: string[] }>>(
    '/preferences/watchlist/stocks',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Update crypto watchlist (add/remove)
 */
export async function updateCryptoWatchlist(params: WatchlistUpdateParams): Promise<{ watchlistCrypto: string[] }> {
  const response = await apiClient.patch<ApiSuccessResponse<{ watchlistCrypto: string[] }>>(
    '/preferences/watchlist/crypto',
    params
  );
  return unwrapResponse(response.data);
}

// Export as namespace
export const preferencesApi = {
  getPreferences,
  updatePreferences,
  resetPreferences,
  updateStockWatchlist,
  updateCryptoWatchlist,
};

