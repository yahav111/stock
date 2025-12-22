/**
 * Stock API Validators
 */

import { z } from 'zod';

export const getStockParams = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

export const getStocksQuery = z.object({
  symbols: z.string()
    .transform((s) => s.split(',').map((sym) => sym.trim().toUpperCase()))
    .refine((arr) => arr.length <= 20, 'Maximum 20 symbols allowed'),
});

export const getHistoryParams = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

export const getHistoryQuery = z.object({
  timespan: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.string()
    .optional()
    .transform((s) => (s ? Math.min(Math.max(parseInt(s, 10), 10), 500) : 100)),
});

export const searchQuery = z.object({
  q: z.string().min(1).max(50),
  limit: z.string()
    .optional()
    .transform((s) => (s ? Math.min(parseInt(s, 10), 20) : 10)),
});

// Type exports
export type GetStockParams = z.infer<typeof getStockParams>;
export type GetStocksQuery = z.infer<typeof getStocksQuery>;
export type GetHistoryParams = z.infer<typeof getHistoryParams>;
export type GetHistoryQuery = z.infer<typeof getHistoryQuery>;
export type SearchQuery = z.infer<typeof searchQuery>;

