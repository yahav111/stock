/**
 * Chart Controller
 * Unified endpoint for both stocks and crypto charts
 */
import type { Request, Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { ApiError } from '../../lib/api-error.js';
import { chartService } from '../../services/chart/chart.service.js';
import type { GetChartQuery } from '../validators/chart.validators.js';

/**
 * GET /api/chart?symbol=XXX&range=1D
 * Get unified chart data (works for both stocks and crypto)
 */
export async function getChart(
  req: Request<object, object, object, GetChartQuery>,
  res: Response
) {
  const { symbol, range = '1D' } = req.query;

  if (!symbol) {
    throw ApiError.badRequest('Symbol parameter is required');
  }

  // Map range to timespan and limit
  const rangeMap: Record<string, { timespan: 'day' | 'week' | 'month'; limit: number }> = {
    '1D': { timespan: 'day', limit: 30 },
    '1W': { timespan: 'week', limit: 52 },
    '1M': { timespan: 'month', limit: 12 },
  };

  const rangeConfig = rangeMap[range.toUpperCase()] || rangeMap['1D'];

  try {
    const chartData = await chartService.getChartData({
      symbol: symbol.toUpperCase(),
      timespan: rangeConfig.timespan,
      limit: rangeConfig.limit,
    });

    res.status(HttpStatus.OK).json(successResponse(chartData, {
      symbol: chartData.symbol,
      type: chartData.type,
      barCount: chartData.bars.length,
    }));
  } catch (error: any) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    throw ApiError.internalServerError(`Failed to fetch chart data: ${error.message}`);
  }
}

