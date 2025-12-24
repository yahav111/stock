/**
 * Portfolio Routes
 * 
 * GET    /api/portfolio              - Get all portfolio entries
 * POST   /api/portfolio              - Add or update portfolio entry
 * PUT    /api/portfolio/:symbol      - Update portfolio entry
 * DELETE /api/portfolio/:symbol    - Delete portfolio entry
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/portfolio.controller.js';
import * as validators from '../validators/portfolio.validators.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/portfolio - Get all portfolio entries
router.get(
  '/',
  asyncHandler(controller.getPortfolio)
);

// POST /api/portfolio - Add or update portfolio entry
router.post(
  '/',
  validate({ body: validators.addPortfolioBody }),
  asyncHandler(controller.addPortfolioEntry)
);

// PUT /api/portfolio/:symbol - Update portfolio entry
router.put(
  '/:symbol',
  validate({ 
    params: validators.getPortfolioParams,
    body: validators.updatePortfolioBody,
  }),
  asyncHandler(controller.updatePortfolioEntry)
);

// DELETE /api/portfolio/:symbol - Delete portfolio entry
router.delete(
  '/:symbol',
  validate({ params: validators.getPortfolioParams }),
  asyncHandler(controller.deletePortfolioEntry)
);

export default router;

