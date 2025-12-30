/**
 * API Routes Aggregator
 * Combines all route modules under /api prefix
 */

import { Router } from 'express';
import stocksRoutes from './stocks.routes.js';
import cryptoRoutes from './crypto.routes.js';
import currenciesRoutes from './currencies.routes.js';
import authRoutes from './auth.routes.js';
import preferencesRoutes from './preferences.routes.js';
import chartRoutes from './chart.routes.js';
import newsRoutes from './news.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import calendarsRoutes from './calendars.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
    },
  });
});

// Mount routes
router.use('/stocks', stocksRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/currencies', currenciesRoutes);
router.use('/auth', authRoutes);
router.use('/preferences', preferencesRoutes);
router.use('/chart', chartRoutes);
router.use('/news', newsRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/calendars', calendarsRoutes);

export default router;

