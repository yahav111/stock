/**
 * useCalendars Hook
 * Fetches calendar data (Economic, Earnings, IPO) from Finnhub API
 */
import { useQuery } from '@tanstack/react-query';
import { calendarsApi } from '../../lib/api/calendars.api';
import type { EconomicEvent, EarningsEvent, IPOEvent } from '../../types';

interface UseCalendarOptions {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  symbol?: string; // For earnings only
  enabled?: boolean;
  refetchInterval?: number; // Polling interval in milliseconds (default: 15 minutes)
}

/**
 * Hook for fetching economic calendar events
 * Uses FMP API - 7 days range
 */
export function useEconomicCalendar(options: UseCalendarOptions = {}) {
  const {
    from,
    to,
    enabled = true,
    refetchInterval = 1 * 60 * 60 * 1000, // 1 hour (matches FMP cache)
  } = options;

  // Default to 7 days if not provided
  const today = new Date();
  const defaultFrom = from || today.toISOString().split('T')[0];
  const defaultTo = to || (() => {
    const future = new Date(today);
    future.setDate(future.getDate() + 7);
    return future.toISOString().split('T')[0];
  })();

  return useQuery({
    queryKey: ['economic-calendar', defaultFrom, defaultTo],
    queryFn: () => calendarsApi.getEconomicCalendar({ from: defaultFrom, to: defaultTo }),
    enabled,
    refetchInterval, // Poll every 1 hour
    refetchOnWindowFocus: true,
    staleTime: 50 * 60 * 1000, // Consider data stale after 50 minutes
  });
}

/**
 * Hook for fetching earnings calendar events
 */
export function useEarningsCalendar(options: UseCalendarOptions = {}) {
  const {
    from,
    to,
    symbol,
    enabled = true,
    refetchInterval = 1 * 60 * 60 * 1000, // 1 hour (matches backend cache)
  } = options;

  return useQuery({
    queryKey: ['earnings-calendar', from, to, symbol],
    queryFn: () => calendarsApi.getEarningsCalendar({ from, to, symbol }),
    enabled,
    refetchInterval, // Poll every 1 hour
    refetchOnWindowFocus: true,
    staleTime: 50 * 60 * 1000, // Consider data stale after 50 minutes
  });
}

/**
 * Hook for fetching IPO calendar events
 * Uses FMP API - 60 days range
 */
export function useIPOCalendar(options: UseCalendarOptions = {}) {
  const {
    from,
    to,
    enabled = true,
    refetchInterval = 1 * 60 * 60 * 1000, // 1 hour (matches FMP cache)
  } = options;

  // Default to 60 days if not provided
  const today = new Date();
  const defaultFrom = from || today.toISOString().split('T')[0];
  const defaultTo = to || (() => {
    const future = new Date(today);
    future.setDate(future.getDate() + 60);
    return future.toISOString().split('T')[0];
  })();

  return useQuery({
    queryKey: ['ipo-calendar', defaultFrom, defaultTo],
    queryFn: () => calendarsApi.getIPOCalendar({ from: defaultFrom, to: defaultTo }),
    enabled,
    refetchInterval, // Poll every 1 hour
    refetchOnWindowFocus: true,
    staleTime: 50 * 60 * 1000, // Consider data stale after 50 minutes
  });
}

/**
 * Hook for fetching upcoming events (all calendars) - for dashboard preview
 */
export function useUpcomingEvents(options: { limit?: number } = {}) {
  const { limit = 5 } = options;

  // Get next 7 days
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const from = today.toISOString().split('T')[0];
  const to = nextWeek.toISOString().split('T')[0];

  const economic = useEconomicCalendar({ from, to, refetchInterval: 1 * 60 * 60 * 1000 });
  const earnings = useEarningsCalendar({ from, to, refetchInterval: 1 * 60 * 60 * 1000 });
  const ipo = useIPOCalendar({ from, to, refetchInterval: 1 * 60 * 60 * 1000 });

  return {
    economic: {
      ...economic,
      data: economic.data?.slice(0, limit),
    },
    earnings: {
      ...earnings,
      data: earnings.data?.slice(0, limit),
    },
    ipo: {
      ...ipo,
      data: ipo.data?.slice(0, limit),
    },
    isLoading: economic.isLoading || earnings.isLoading || ipo.isLoading,
    isError: economic.isError || earnings.isError || ipo.isError,
  };
}

