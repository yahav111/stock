/**
 * Calendars API
 * Economic, Earnings, and IPO calendar API calls
 */

import apiClient, { unwrapResponse } from './client';
import type { ApiSuccessResponse } from './client';
import type { EconomicEvent, EarningsEvent, IPOEvent } from '../../types';

// ===================
// Types
// ===================

export interface GetCalendarParams {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  symbol?: string; // For earnings only
}

// ===================
// API Functions
// ===================

/**
 * Get economic calendar events
 */
export async function getEconomicCalendar(params?: GetCalendarParams): Promise<EconomicEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<EconomicEvent[]>>(
    '/calendars/economic',
    { params }
  );
  return unwrapResponse(response.data);
}

/**
 * Get earnings calendar events
 */
export async function getEarningsCalendar(params?: GetCalendarParams): Promise<EarningsEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<EarningsEvent[]>>(
    '/calendars/earnings',
    { params }
  );
  return unwrapResponse(response.data);
}

/**
 * Get IPO calendar events
 */
export async function getIPOCalendar(params?: GetCalendarParams): Promise<IPOEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<IPOEvent[]>>(
    '/calendars/ipo',
    { params }
  );
  return unwrapResponse(response.data);
}

// Export as namespace
export const calendarsApi = {
  getEconomicCalendar,
  getEarningsCalendar,
  getIPOCalendar,
};

