/**
 * Portfolio API Validators
 */

import { z } from 'zod';

export const getPortfolioParams = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

export const addPortfolioBody = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  shares: z.number().positive('Shares must be positive'),
  averagePrice: z.number().positive('Average price must be positive'),
});

export const updatePortfolioBody = z.object({
  shares: z.number().positive('Shares must be positive').optional(),
  averagePrice: z.number().positive('Average price must be positive').optional(),
});

export const setInitialCashBody = z.object({
  initialCash: z.number().nonnegative('Initial cash must be non-negative'),
});

// Type exports
export type GetPortfolioParams = z.infer<typeof getPortfolioParams>;
export type AddPortfolioBody = z.infer<typeof addPortfolioBody>;
export type UpdatePortfolioBody = z.infer<typeof updatePortfolioBody>;
export type SetInitialCashBody = z.infer<typeof setInitialCashBody>;

