/**
 * Chart Routes
 * Unified chart endpoint for stocks and crypto
 * 
 * GET /api/chart?symbol=XXX&range=1D
 * GET /api/chart/forex/:symbol - Get forex chart data
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import * as controller from '../controllers/chart.controller.js';
import * as validators from '../validators/chart.validators.js';

const router = Router();

// GET /api/chart - Get unified chart data (stocks or crypto)
router.get(
  '/',
  validate({ query: validators.getChartQuery }),
  asyncHandler(controller.getChart)
);

// GET /api/chart/forex/:symbol - Get forex chart data
router.get(
  '/forex/:symbol',
  validate({ 
    params: validators.getForexChartParams,
    query: validators.getForexChartQuery,
  }),
  asyncHandler(controller.getForexChart)
);

export default router;

