/**
 * News Routes
 * Market news endpoints using Finnhub API
 */
import { Router } from 'express';
import { getMarketNews } from '../../services/external-apis/finnhub.service.js';
import type { ApiResponse, MarketNews } from '../../types/index.js';

const router = Router();

/**
 * GET /api/news
 * Get market news
 * Query params:
 *   - category: 'general' | 'forex' | 'crypto' | 'merger' (default: 'general')
 *   - minId: Optional minimum news ID for pagination
 */
router.get('/', async (req, res) => {
  try {
    const category = (req.query.category as string) || 'general';
    const minId = req.query.minId ? parseInt(req.query.minId as string, 10) : undefined;

    // Validate category
    const validCategories = ['general', 'forex', 'crypto', 'merger'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      } as ApiResponse<never>);
    }

    const news = await getMarketNews(category, minId);

    res.json({
      success: true,
      data: news,
    } as ApiResponse<MarketNews[]>);
  } catch (error: any) {
    console.error('Error fetching market news:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market news',
    } as ApiResponse<never>);
  }
});

export default router;

