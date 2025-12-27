/**
 * Portfolio React Query Hooks
 * Provides data fetching with caching, refetching, and loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '../../lib/api';
import type { AddPortfolioEntryParams, UpdatePortfolioEntryParams, SetInitialCashParams } from '../../types';

// Query keys for cache management
export const portfolioKeys = {
  all: ['portfolio'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  list: () => [...portfolioKeys.lists()] as const,
};

/**
 * Hook to get portfolio entries
 */
export function usePortfolio() {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: portfolioApi.getPortfolio,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Hook to add or update a portfolio entry
 */
export function useAddPortfolioEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: AddPortfolioEntryParams) => portfolioApi.addPortfolioEntry(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

/**
 * Hook to update a portfolio entry
 */
export function useUpdatePortfolioEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ symbol, ...params }: { symbol: string } & UpdatePortfolioEntryParams) => 
      portfolioApi.updatePortfolioEntry(symbol, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

/**
 * Hook to delete a portfolio entry
 */
export function useDeletePortfolioEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (symbol: string) => portfolioApi.deletePortfolioEntry(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

/**
 * Hook to set initial cash
 */
export function useSetInitialCash() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: SetInitialCashParams) => portfolioApi.setInitialCash(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

/**
 * Hook to invalidate portfolio cache
 */
export function useInvalidatePortfolio() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: portfolioKeys.all }),
  };
}

