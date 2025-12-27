/**
 * Currencies Routes
 * 
 * GET    /api/currencies/rates           - Get exchange rates
 * GET    /api/currencies/defaults       - Get default currency rates
 * GET    /api/currencies/pairs          - Get specific currency pairs
 * POST   /api/currencies/convert        - Convert between currencies
 * GET    /api/currencies/forex/intraday - Get intraday Forex data (24h, 5min intervals)
 * GET    /api/currencies/forex/daily    - Get daily Forex data (7 days)
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import * as controller from '../controllers/currencies.controller.js';
import * as validators from '../validators/currencies.validators.js';

const router = Router();

// GET /api/currencies/rates - Get exchange rates
router.get(
  '/rates',
  validate({ query: validators.getRatesQuery }),
  asyncHandler(controller.getRates as any)
);

// GET /api/currencies/defaults - Get default currency rates
router.get(
  '/defaults',
  asyncHandler(controller.getDefaults)
);

// GET /api/currencies/pairs - Get specific currency pairs
router.get(
  '/pairs',
  validate({ query: validators.getPairsQuery }),
  asyncHandler(controller.getPairs as any)
);

// POST /api/currencies/convert - Convert between currencies
router.post(
  '/convert',
  validate({ body: validators.convertBody }),
  asyncHandler(controller.convert as any)
);

// GET /api/currencies/forex/intraday - Get intraday Forex data
router.get(
  '/forex/intraday',
  asyncHandler(controller.getForexIntraday)
);

// GET /api/currencies/forex/daily - Get daily Forex data
router.get(
  '/forex/daily',
  asyncHandler(controller.getForexDaily)
);

export default router;

