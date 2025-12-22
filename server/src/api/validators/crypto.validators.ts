/**
 * Crypto API Validators
 */

import { z } from 'zod';

export const getCryptoParams = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
});

export const getCryptosQuery = z.object({
  symbols: z.string()
    .transform((s) => s.split(',').map((sym) => sym.trim().toUpperCase()))
    .refine((arr) => arr.length <= 20, 'Maximum 20 symbols allowed'),
});

export const searchQuery = z.object({
  q: z.string().min(1).max(50),
  limit: z.string()
    .optional()
    .transform((s) => (s ? Math.min(parseInt(s, 10), 20) : 10)),
});

// Type exports
export type GetCryptoParams = z.infer<typeof getCryptoParams>;
export type GetCryptosQuery = z.infer<typeof getCryptosQuery>;
export type SearchQuery = z.infer<typeof searchQuery>;

