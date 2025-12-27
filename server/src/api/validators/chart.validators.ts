/**
 * Chart Validators
 * Validation schemas for chart endpoints
 */
import { z } from 'zod';

export const getChartQuery = z.object({
  symbol: z.string().min(1).max(10),
  range: z.enum(['1D', '1W', '1M']).optional().default('1D'),
});

export type GetChartQuery = z.infer<typeof getChartQuery>;

export const getForexChartParams = z.object({
  symbol: z.string().min(1).max(10),
});

export const getForexChartQuery = z.object({
  interval: z.enum(['1day', '1week']).optional().default('1day'),
});

export type GetForexChartParams = z.infer<typeof getForexChartParams>;
export type GetForexChartQuery = z.infer<typeof getForexChartQuery>;

