/**
 * Auth Routes
 * 
 * POST   /api/auth/signup     - Create new account
 * POST   /api/auth/login      - Login and create session
 * POST   /api/auth/logout     - Invalidate session
 * GET    /api/auth/me         - Get current user
 * GET    /api/auth/session    - Check session validity
 */

import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/auth.controller.js';
import * as validators from '../validators/auth.validators.js';

const router = Router();

// POST /api/auth/signup - Create new account
router.post(
  '/signup',
  validate({ body: validators.signupBody }),
  asyncHandler(controller.signup)
);

// POST /api/auth/login - Login and create session
router.post(
  '/login',
  validate({ body: validators.loginBody }),
  asyncHandler(controller.login)
);

// POST /api/auth/logout - Invalidate session
router.post(
  '/logout',
  optionalAuth,
  asyncHandler(controller.logout)
);

// GET /api/auth/me - Get current user (requires auth)
router.get(
  '/me',
  requireAuth,
  asyncHandler(controller.me)
);

// GET /api/auth/session - Check session validity (requires auth)
router.get(
  '/session',
  requireAuth,
  asyncHandler(controller.checkSession)
);

export default router;

