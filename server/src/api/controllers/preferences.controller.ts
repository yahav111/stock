/**
 * Preferences Controller
 * Handles user userPreferences API requests
 */

import type { Request, Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { db } from '../../db/index.js';
import { userPreferences } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { UpdatePreferencesBody } from '../validators/preferences.validators.js';

// Default userPreferences
const defaultPreferences = {
  watchlistStocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
  watchlistCrypto: ['BTC', 'ETH', 'SOL'],
  favoriteCurrencies: ['USD', 'EUR', 'GBP', 'ILS'],
  theme: 'dark' as const,
  defaultChart: 'candlestick' as const,
  defaultTimeframe: '1D' as const,
};

/**
 * GET /api/userPreferences
 * Get user userPreferences
 */
export async function getPreferences(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  
  const userPrefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, authReq.user.id),
  });
  
  // Return user userPreferences or defaults
  const result = userPrefs ? {
    watchlistStocks: userPrefs.watchlistStocks || defaultPreferences.watchlistStocks,
    watchlistCrypto: userPrefs.watchlistCrypto || defaultPreferences.watchlistCrypto,
    favoriteCurrencies: userPrefs.favoriteCurrencies || defaultPreferences.favoriteCurrencies,
    theme: userPrefs.theme || defaultPreferences.theme,
    defaultChart: userPrefs.defaultChart || defaultPreferences.defaultChart,
    defaultTimeframe: userPrefs.defaultTimeframe || defaultPreferences.defaultTimeframe,
  } : defaultPreferences;
  
  res.status(HttpStatus.OK).json(successResponse(result));
}

/**
 * PUT /api/userPreferences
 * Update user userPreferences
 */
export async function updatePreferences(
  req: Request<object, object, UpdatePreferencesBody>,
  res: Response
) {
  const authReq = req as AuthenticatedRequest;
  const updates = req.body;
  
  // Check if userPreferences exist
  const existingPrefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, authReq.user.id),
  });
  
  let result;
  
  if (existingPrefs) {
    // Update existing userPreferences
    [result] = await db
      .update(userPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, authReq.user.id))
      .returning();
  } else {
    // Create new userPreferences
    [result] = await db
      .insert(userPreferences)
      .values({
        userId: authReq.user.id,
        ...defaultPreferences,
        ...updates,
      })
      .returning();
  }
  
  res.status(HttpStatus.OK).json(successResponse({
    watchlistStocks: result.watchlistStocks || defaultPreferences.watchlistStocks,
    watchlistCrypto: result.watchlistCrypto || defaultPreferences.watchlistCrypto,
    favoriteCurrencies: result.favoriteCurrencies || defaultPreferences.favoriteCurrencies,
    theme: result.theme || defaultPreferences.theme,
    defaultChart: result.defaultChart || defaultPreferences.defaultChart,
    defaultTimeframe: result.defaultTimeframe || defaultPreferences.defaultTimeframe,
  }));
}

/**
 * DELETE /api/userPreferences
 * Reset userPreferences to defaults
 */
export async function resetPreferences(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  
  await db
    .delete(userPreferences)
    .where(eq(userPreferences.userId, authReq.user.id));
  
  res.status(HttpStatus.OK).json(successResponse(defaultPreferences));
}

/**
 * PATCH /api/userPreferences/watchlist/stocks
 * Add or remove stocks from watchlist
 */
export async function updateStockWatchlist(
  req: Request<object, object, { add?: string[]; remove?: string[] }>,
  res: Response
) {
  const authReq = req as AuthenticatedRequest;
  const { add, remove } = req.body;
  
  console.log(`[PREFERENCES] updateStockWatchlist called for user ${authReq.user.id}:`, { add, remove });
  
  const existingPrefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, authReq.user.id),
  });
  
  console.log(`[PREFERENCES] Existing preferences:`, existingPrefs ? { 
    watchlistStocks: existingPrefs.watchlistStocks,
    watchlistCrypto: existingPrefs.watchlistCrypto 
  } : 'none');
  
  let currentWatchlist = existingPrefs?.watchlistStocks || [...defaultPreferences.watchlistStocks];
  
  // Remove specified symbols
  if (remove?.length) {
    console.log(`[PREFERENCES] Removing symbols:`, remove);
    currentWatchlist = currentWatchlist.filter((s) => !remove.includes(s));
  }
  
  // Add specified symbols (avoid duplicates)
  if (add?.length) {
    console.log(`[PREFERENCES] Adding symbols:`, add);
    const newSymbols = add.filter((s) => !currentWatchlist.includes(s));
    currentWatchlist = [...currentWatchlist, ...newSymbols];
    console.log(`[PREFERENCES] New symbols added:`, newSymbols);
  }
  
  // Limit to 50 symbols
  currentWatchlist = currentWatchlist.slice(0, 50);
  
  console.log(`[PREFERENCES] Final watchlist:`, currentWatchlist);
  
  if (existingPrefs) {
    await db
      .update(userPreferences)
      .set({ watchlistStocks: currentWatchlist, updatedAt: new Date() })
      .where(eq(userPreferences.userId, authReq.user.id));
    console.log(`[PREFERENCES] Updated existing preferences`);
  } else {
    await db.insert(userPreferences).values({
      userId: authReq.user.id,
      ...defaultPreferences,
      watchlistStocks: currentWatchlist,
    });
    console.log(`[PREFERENCES] Created new preferences`);
  }
  
  console.log(`[PREFERENCES] Successfully saved watchlist with ${currentWatchlist.length} stocks`);
  res.status(HttpStatus.OK).json(successResponse({ watchlistStocks: currentWatchlist }));
}

/**
 * PATCH /api/userPreferences/watchlist/crypto
 * Add or remove crypto from watchlist
 */
export async function updateCryptoWatchlist(
  req: Request<object, object, { add?: string[]; remove?: string[] }>,
  res: Response
) {
  const authReq = req as AuthenticatedRequest;
  const { add, remove } = req.body;
  
  const existingPrefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, authReq.user.id),
  });
  
  let currentWatchlist = existingPrefs?.watchlistCrypto || [...defaultPreferences.watchlistCrypto];
  
  if (remove?.length) {
    currentWatchlist = currentWatchlist.filter((s) => !remove.includes(s));
  }
  
  if (add?.length) {
    const newSymbols = add.filter((s) => !currentWatchlist.includes(s));
    currentWatchlist = [...currentWatchlist, ...newSymbols];
  }
  
  currentWatchlist = currentWatchlist.slice(0, 50);
  
  if (existingPrefs) {
    await db
      .update(userPreferences)
      .set({ watchlistCrypto: currentWatchlist, updatedAt: new Date() })
      .where(eq(userPreferences.userId, authReq.user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: authReq.user.id,
      ...defaultPreferences,
      watchlistCrypto: currentWatchlist,
    });
  }
  
  res.status(HttpStatus.OK).json(successResponse({ watchlistCrypto: currentWatchlist }));
}

