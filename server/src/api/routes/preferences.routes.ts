/**
 * Preferences Routes
 * 
 * GET    /api/preferences                   - Get user preferences
 * PUT    /api/preferences                   - Update all preferences
 * DELETE /api/preferences                   - Reset to defaults
 * PATCH  /api/preferences/watchlist/stocks  - Update stock watchlist
 * PATCH  /api/preferences/watchlist/crypto  - Update crypto watchlist
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/preferences.controller.js';
import * as validators from '../validators/preferences.validators.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/preferences - Get user preferences
router.get(
  '/',
  asyncHandler(controller.getPreferences)
);

// PUT /api/preferences - Update all preferences
router.put(
  '/',
  validate({ body: validators.updatePreferencesBody }),
  asyncHandler(controller.updatePreferences)
);

// DELETE /api/preferences - Reset to defaults
router.delete(
  '/',
  asyncHandler(controller.resetPreferences)
);

// PATCH /api/preferences/watchlist/stocks - Update stock watchlist
router.patch(
  '/watchlist/stocks',
  asyncHandler(controller.updateStockWatchlist)
);

// PATCH /api/preferences/watchlist/crypto - Update crypto watchlist
router.patch(
  '/watchlist/crypto',
  asyncHandler(controller.updateCryptoWatchlist)
);

export default router;

