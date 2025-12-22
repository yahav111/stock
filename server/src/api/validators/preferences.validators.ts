/**
 * Preferences API Validators
 */

import { z } from 'zod';

export const updatePreferencesBody = z.object({
  watchlistStocks: z.array(z.string().toUpperCase()).max(50).optional(),
  watchlistCrypto: z.array(z.string().toUpperCase()).max(50).optional(),
  favoriteCurrencies: z.array(z.string().length(3).toUpperCase()).max(20).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultChart: z.enum(['candlestick', 'line', 'area']).optional(),
  defaultTimeframe: z.enum(['1m', '5m', '15m', '1H', '4H', '1D', '1W']).optional(),
});

// Type exports
export type UpdatePreferencesBody = z.infer<typeof updatePreferencesBody>;

