/**
 * Unified Chart API
 * Works for both stocks and crypto - backend decides
 */
import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';
import type { HistoricalBar } from '../../types';

export interface ChartDataParams {
  symbol: string;
  range?: '1D' | '1W' | '1M';
}

export interface ChartDataResponse {
  symbol: string;
  type: 'crypto' | 'stock';
  bars: HistoricalBar[];
  name?: string;
}

export interface ForexChartDataParams {
  symbol: string;
  interval?: '1day' | '1week';
}

export interface ForexChartDataResponse {
  symbol: string;
  pair: string;
  type: 'forex';
  bars: HistoricalBar[];
  name?: string;
}

/**
 * Get unified chart data (stocks or crypto)
 */
export async function getChartData(params: ChartDataParams, signal?: AbortSignal): Promise<ChartDataResponse> {
  const { symbol, range = '1D' } = params;
  const response = await apiClient.get<ApiSuccessResponse<ChartDataResponse>>(
    '/chart',
    { params: { symbol, range }, signal }
  );
  return unwrapResponse(response.data);
}

/**
 * Get forex chart data (always relative to USD)
 */
export async function getForexChartData(params: ForexChartDataParams, signal?: AbortSignal): Promise<ForexChartDataResponse> {
  const { symbol, interval = '1day' } = params;
  const response = await apiClient.get<ApiSuccessResponse<ForexChartDataResponse>>(
    `/chart/forex/${encodeURIComponent(symbol.toUpperCase())}`,
    { params: { interval }, signal }
  );
  return unwrapResponse(response.data);
}

export const chartApi = {
  getChartData,
  getForexChartData,
};

