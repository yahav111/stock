/**
 * Stocks Routes
 * 
 * GET    /api/stocks              - Get multiple stock quotes
 * GET    /api/stocks/defaults     - Get default stock quotes
 * GET    /api/stocks/search       - Search for stocks
 * GET    /api/stocks/:symbol      - Get single stock quote
 * GET    /api/stocks/:symbol/history  - Get historical data
 * GET    /api/stocks/:symbol/details  - Get detailed info
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import * as controller from '../controllers/stocks.controller.js';
import * as validators from '../validators/stocks.validators.js';

const router = Router();

// GET /api/stocks - Get multiple stock quotes
router.get(
  '/',
  validate({ query: validators.getStocksQuery }),
  asyncHandler(controller.getStocks)
);

// GET /api/stocks/defaults - Get default stock quotes
router.get(
  '/defaults',
  asyncHandler(controller.getDefaults)
);

// GET /api/stocks/search - Search for stocks
router.get(
  '/search',
  validate({ query: validators.searchQuery }),
  asyncHandler(controller.search)
);

// GET /api/stocks/:symbol - Get single stock quote
router.get(
  '/:symbol',
  validate({ params: validators.getStockParams }),
  asyncHandler(controller.getStock)
);

// GET /api/stocks/:symbol/history - Get historical data
router.get(
  '/:symbol/history',
  validate({ 
    params: validators.getHistoryParams,
    query: validators.getHistoryQuery,
  }),
  asyncHandler(controller.getHistory)
);

// GET /api/stocks/:symbol/details - Get detailed info
router.get(
  '/:symbol/details',
  validate({ params: validators.getStockParams }),
  asyncHandler(controller.getDetails)
);

export default router;

