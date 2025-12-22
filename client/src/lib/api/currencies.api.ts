/**
 * Currencies API
 * All currency-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';

// ===================
// Types
// ===================

export interface ExchangeRates {
  [currency: string]: number;
}

export interface ConvertParams {
  amount: number;
  from: string;
  to: string;
}

export interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: number;
}

export interface CurrencyPair {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
}

export interface DefaultRatesResult {
  base: string;
  rates: ExchangeRates;
  timestamp: number;
}

// ===================
// API Functions
// ===================

/**
 * Get exchange rates
 */
export async function getRates(base: string = 'USD'): Promise<ExchangeRates> {
  const response = await apiClient.get<ApiSuccessResponse<ExchangeRates>>(
    '/currencies/rates',
    { params: { base } }
  );
  return unwrapResponse(response.data);
}

/**
 * Get default currency rates
 */
export async function getDefaults(): Promise<DefaultRatesResult> {
  const response = await apiClient.get<ApiSuccessResponse<DefaultRatesResult>>(
    '/currencies/defaults'
  );
  return unwrapResponse(response.data);
}

/**
 * Convert between currencies
 */
export async function convert(params: ConvertParams): Promise<ConvertResult> {
  const response = await apiClient.post<ApiSuccessResponse<ConvertResult>>(
    '/currencies/convert',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Get specific currency pairs
 */
export async function getPairs(pairs: string[]): Promise<CurrencyPair[]> {
  const response = await apiClient.get<ApiSuccessResponse<CurrencyPair[]>>(
    '/currencies/pairs',
    { params: { pairs: pairs.join(',') } }
  );
  return unwrapResponse(response.data);
}

// Export as namespace
export const currenciesApi = {
  getRates,
  getDefaults,
  convert,
  getPairs,
};

