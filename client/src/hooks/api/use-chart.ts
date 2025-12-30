/**
 * Unified Chart Hook
 * Works for both stocks and crypto
 */
import { useQuery } from '@tanstack/react-query';
import { chartApi, type ChartDataParams, type ForexChartDataParams } from '../../lib/api/chart.api';

export const chartKeys = {
  all: ['chart'] as const,
  chart: (params: ChartDataParams) => [...chartKeys.all, params] as const,
  forexChart: (params: ForexChartDataParams) => [...chartKeys.all, 'forex', params] as const,
};

/**
 * Hook to get unified chart data (stocks or crypto)
 * Automatically refetches when params change (symbol, range)
 * Uses AbortController to cancel previous requests when a new search starts
 */
export function useChart(params: ChartDataParams, enabled = true) {
  // Calculate staleTime based on range for dynamic updates
  const staleTime = params.range === '1D' 
    ? 60 * 60 * 1000      // 1 hour for daily (updates every day)
    : params.range === '1W'
    ? 6 * 60 * 60 * 1000  // 6 hours for weekly (updates once a week)
    : 24 * 60 * 60 * 1000; // 24 hours for monthly (updates once a month)

  return useQuery({
    queryKey: chartKeys.chart(params),
    queryFn: ({ signal }) => chartApi.getChartData(params, signal),
    enabled: !!params.symbol && enabled,
    staleTime,
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1,
    // Refetch when window regains focus (for real-time updates)
    refetchOnWindowFocus: true,
    // Refetch when component mounts to ensure fresh data
    refetchOnMount: true,
    // Refetch interval based on range - more frequent for daily to get today's data
    // For daily charts, refetch every 2 minutes to match stock price updates
    refetchInterval: params.range === '1D' 
      ? 2 * 60 * 1000       // Refetch every 2 minutes for daily (to match stock price updates)
      : params.range === '1W'
      ? 6 * 60 * 60 * 1000   // Refetch every 6 hours for weekly
      : false,                // No auto-refetch for monthly
  });
}

/**
 * Hook to get forex chart data
 * Automatically refetches when params change (symbol, interval)
 * Uses AbortController to cancel previous requests when a new search starts
 */
export function useForexChart(params: ForexChartDataParams, enabled = true) {
  // Calculate staleTime based on interval
  const staleTime = params.interval === '1day' 
    ? 5 * 60 * 1000        // 5 minutes for daily (matches cache TTL)
    : 30 * 60 * 1000;      // 30 minutes for weekly

  return useQuery({
    queryKey: chartKeys.forexChart(params),
    queryFn: ({ signal }) => chartApi.getForexChartData(params, signal),
    enabled: !!params.symbol && enabled,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // Refetch interval matches cache TTL for daily
    refetchInterval: params.interval === '1day' 
      ? 5 * 60 * 1000       // Refetch every 5 minutes for daily (matches cache)
      : 30 * 60 * 1000,     // Refetch every 30 minutes for weekly
  });
}

