/**
 * Currency API Validators
 */

import { z } from 'zod';

export const getRatesQuery = z.object({
  base: z.string().length(3).toUpperCase().default('USD'),
});

export const convertBody = z.object({
  amount: z.number().positive(),
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
});

export const getPairsQuery = z.object({
  pairs: z.string()
    .transform((s) => s.split(',').map((p) => p.trim().toUpperCase()))
    .refine((arr) => arr.length <= 20, 'Maximum 20 pairs allowed'),
});

// Type exports
export type GetRatesQuery = z.infer<typeof getRatesQuery>;
export type ConvertBody = z.infer<typeof convertBody>;
export type GetPairsQuery = z.infer<typeof getPairsQuery>;

