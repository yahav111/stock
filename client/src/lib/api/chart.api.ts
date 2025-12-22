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

/**
 * Get unified chart data (stocks or crypto)
 */
export async function getChartData(params: ChartDataParams): Promise<ChartDataResponse> {
  const { symbol, range = '1D' } = params;
  const response = await apiClient.get<ApiSuccessResponse<ChartDataResponse>>(
    '/chart',
    { params: { symbol, range } }
  );
  return unwrapResponse(response.data);
}

export const chartApi = {
  getChartData,
};

