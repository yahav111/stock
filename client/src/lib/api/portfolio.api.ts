/**
 * Portfolio API
 * All portfolio-related API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';
import type { PortfolioResponse, PortfolioEntry, PortfolioBalance, AddPortfolioEntryParams, UpdatePortfolioEntryParams, SetInitialCashParams } from '../../types';

// ===================
// API Functions
// ===================

/**
 * Get all portfolio entries
 */
export async function getPortfolio(): Promise<PortfolioResponse> {
  const response = await apiClient.get<ApiSuccessResponse<PortfolioResponse>>(
    '/portfolio'
  );
  return unwrapResponse(response.data);
}

/**
 * Add or update a portfolio entry
 */
export async function addPortfolioEntry(params: AddPortfolioEntryParams): Promise<PortfolioEntry> {
  const response = await apiClient.post<ApiSuccessResponse<PortfolioEntry>>(
    '/portfolio',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Update a portfolio entry
 */
export async function updatePortfolioEntry(
  symbol: string,
  params: UpdatePortfolioEntryParams
): Promise<PortfolioEntry> {
  const response = await apiClient.put<ApiSuccessResponse<PortfolioEntry>>(
    `/portfolio/${symbol.toUpperCase()}`,
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Delete a portfolio entry
 */
export async function deletePortfolioEntry(symbol: string): Promise<void> {
  const response = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(
    `/portfolio/${symbol.toUpperCase()}`
  );
  unwrapResponse(response.data);
}

/**
 * Set initial cash amount
 */
export async function setInitialCash(params: SetInitialCashParams): Promise<PortfolioBalance> {
  const response = await apiClient.post<ApiSuccessResponse<PortfolioBalance>>(
    '/portfolio/initial-cash',
    params
  );
  return unwrapResponse(response.data);
}

/**
 * Get portfolio balance
 */
export async function getPortfolioBalance(): Promise<PortfolioBalance> {
  const response = await apiClient.get<ApiSuccessResponse<PortfolioBalance>>(
    '/portfolio/balance'
  );
  return unwrapResponse(response.data);
}

// Export as namespace for easier imports
export const portfolioApi = {
  getPortfolio,
  addPortfolioEntry,
  updatePortfolioEntry,
  deletePortfolioEntry,
  setInitialCash,
  getPortfolioBalance,
};

