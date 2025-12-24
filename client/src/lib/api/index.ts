/**
 * API Module Exports
 * 
 * Usage:
 * import { api } from '@/lib/api'
 * 
 * // Stocks
 * const stock = await api.stocks.getStock('AAPL')
 * 
 * // Crypto
 * const crypto = await api.crypto.getCrypto('BTC')
 * 
 * // Currencies
 * const result = await api.currencies.convert({ amount: 100, from: 'USD', to: 'EUR' })
 * 
 * // Auth
 * const user = await api.auth.login({ email, password })
 * 
 * // Preferences
 * const prefs = await api.preferences.getPreferences()
 */

// API client and utilities
export { default as apiClient } from './client';
export { 
  unwrapResponse, 
  ApiClientError, 
  isApiError, 
  getErrorMessage,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from './client';

// Domain APIs
export { stocksApi } from './stocks.api';
export { cryptoApi } from './crypto.api';
export { currenciesApi } from './currencies.api';
export { authApi } from './auth.api';
export { preferencesApi } from './preferences.api';
export { portfolioApi } from './portfolio.api';

// Re-export types
export type { GetStocksParams, GetHistoryParams, SearchParams as StockSearchParams, SearchResult as StockSearchResult } from './stocks.api';
export type { GetCryptosParams, SearchParams as CryptoSearchParams, SearchResult as CryptoSearchResult } from './crypto.api';
export type { ExchangeRates, ConvertParams, ConvertResult, CurrencyPair, DefaultRatesResult } from './currencies.api';
export type { SignupParams, LoginParams, User, AuthResult, SessionInfo } from './auth.api';
export type { UserPreferences, UpdatePreferencesParams, WatchlistUpdateParams } from './preferences.api';
export type { AddPortfolioEntryParams, UpdatePortfolioEntryParams } from './portfolio.api';

// Unified API object for convenience
import { stocksApi } from './stocks.api';
import { cryptoApi } from './crypto.api';
import { currenciesApi } from './currencies.api';
import { authApi } from './auth.api';
import { preferencesApi } from './preferences.api';
import { portfolioApi } from './portfolio.api';

export const api = {
  stocks: stocksApi,
  crypto: cryptoApi,
  currencies: currenciesApi,
  auth: authApi,
  preferences: preferencesApi,
  portfolio: portfolioApi,
} as const;

