/**
 * Crypto Routes
 * 
 * GET    /api/crypto              - Get multiple crypto prices
 * GET    /api/crypto/defaults     - Get default crypto prices
 * GET    /api/crypto/search       - Search for cryptocurrencies
 * GET    /api/crypto/:symbol      - Get single crypto price
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import * as controller from '../controllers/crypto.controller.js';
import * as validators from '../validators/crypto.validators.js';

const router = Router();

// GET /api/crypto - Get multiple crypto prices
router.get(
  '/',
  validate({ query: validators.getCryptosQuery }),
  asyncHandler(controller.getCryptos)
);

// GET /api/crypto/defaults - Get default crypto prices
router.get(
  '/defaults',
  asyncHandler(controller.getDefaults)
);

// GET /api/crypto/search - Search for cryptocurrencies
router.get(
  '/search',
  validate({ query: validators.searchQuery }),
  asyncHandler(controller.search)
);

// GET /api/crypto/:symbol - Get single crypto price
router.get(
  '/:symbol',
  validate({ params: validators.getCryptoParams }),
  asyncHandler(controller.getCrypto)
);

export default router;

