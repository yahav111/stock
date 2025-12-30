/**
 * Calendars Routes
 * Economic, Earnings, and IPO calendar endpoints using Finnhub API
 */
import { Router } from 'express';
import { getEconomicCalendar, getEarningsCalendar, getIPOCalendar } from '../../services/external-apis/finnhub.service.js';
import type { ApiResponse, EconomicEvent, EarningsEvent, IPOEvent } from '../../types/index.js';

const router = Router();

/**
 * GET /api/calendars/economic
 * Get economic calendar events
 * Query params:
 *   - from: Start date (YYYY-MM-DD)
 *   - to: End date (YYYY-MM-DD)
 */
router.get('/economic', async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const events = await getEconomicCalendar(from, to);

    res.json({
      success: true,
      data: events,
    } as ApiResponse<EconomicEvent[]>);
  } catch (error: any) {
    console.error('Error fetching economic calendar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch economic calendar',
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/calendars/earnings
 * Get earnings calendar events
 * Query params:
 *   - from: Start date (YYYY-MM-DD)
 *   - to: End date (YYYY-MM-DD)
 *   - symbol: Optional symbol filter
 */
router.get('/earnings', async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const symbol = req.query.symbol as string | undefined;

    const events = await getEarningsCalendar(from, to, symbol);

    res.json({
      success: true,
      data: events,
    } as ApiResponse<EarningsEvent[]>);
  } catch (error: any) {
    console.error('Error fetching earnings calendar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch earnings calendar',
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/calendars/ipo
 * Get IPO calendar events
 * Query params:
 *   - from: Start date (YYYY-MM-DD)
 *   - to: End date (YYYY-MM-DD)
 */
router.get('/ipo', async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const events = await getIPOCalendar(from, to);

    res.json({
      success: true,
      data: events,
    } as ApiResponse<IPOEvent[]>);
  } catch (error: any) {
    console.error('Error fetching IPO calendar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch IPO calendar',
    } as ApiResponse<never>);
  }
});

export default router;

