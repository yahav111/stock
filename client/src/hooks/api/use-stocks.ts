/**
 * Stocks React Query Hooks
 * Provides data fetching with caching, refetching, and loading states
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stocksApi, type GetHistoryParams, type StockSearchParams } from '../../lib/api';

// Query keys for cache management
export const stocksKeys = {
  all: ['stocks'] as const,
  lists: () => [...stocksKeys.all, 'list'] as const,
  list: (symbols: string[]) => [...stocksKeys.lists(), symbols] as const,
  defaults: () => [...stocksKeys.all, 'defaults'] as const,
  details: () => [...stocksKeys.all, 'details'] as const,
  detail: (symbol: string) => [...stocksKeys.details(), symbol] as const,
  histories: () => [...stocksKeys.all, 'history'] as const,
  history: (params: GetHistoryParams) => [...stocksKeys.histories(), params] as const,
  searches: () => [...stocksKeys.all, 'search'] as const,
  search: (params: StockSearchParams) => [...stocksKeys.searches(), params] as const,
};

/**
 * Hook to get a single stock quote
 */
export function useStock(symbol: string, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.detail(symbol),
    queryFn: () => stocksApi.getStock(symbol),
    enabled: !!symbol && enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to get multiple stock quotes
 */
export function useStocks(symbols: string[], enabled = true) {
  return useQuery({
    queryKey: stocksKeys.list(symbols),
    queryFn: () => stocksApi.getStocks(symbols),
    enabled: symbols.length > 0 && enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to get default stocks
 */
export function useDefaultStocks() {
  return useQuery({
    queryKey: stocksKeys.defaults(),
    queryFn: stocksApi.getDefaults,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Hook to get stock history
 */
export function useStockHistory(params: GetHistoryParams, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.history(params),
    queryFn: () => stocksApi.getHistory(params),
    enabled: !!params.symbol && enabled,
    staleTime: 60 * 60 * 1000, // 1 hour (data doesn't change that often)
    gcTime: 2 * 60 * 60 * 1000, // Keep in cache for 2 hours
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook to get stock details
 */
export function useStockDetails(symbol: string, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.detail(symbol),
    queryFn: () => stocksApi.getDetails(symbol),
    enabled: !!symbol && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to search stocks
 * Uses AbortController to cancel previous requests when a new search starts
 */
export function useStockSearch(params: StockSearchParams, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.search(params),
    queryFn: ({ signal }) => stocksApi.search(params, signal),
    enabled: params.q.length >= 2 && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to prefetch stock data
 */
export function usePrefetchStock() {
  const queryClient = useQueryClient();
  
  return (symbol: string) => {
    queryClient.prefetchQuery({
      queryKey: stocksKeys.detail(symbol),
      queryFn: () => stocksApi.getStock(symbol),
      staleTime: 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate stock cache
 */
export function useInvalidateStocks() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: stocksKeys.all }),
    invalidateStock: (symbol: string) => queryClient.invalidateQueries({ queryKey: stocksKeys.detail(symbol) }),
    invalidateDefaults: () => queryClient.invalidateQueries({ queryKey: stocksKeys.defaults() }),
  };
}

