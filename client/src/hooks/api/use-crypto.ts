/**
 * Crypto React Query Hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cryptoApi, type CryptoSearchParams } from '../../lib/api';

// Query keys
export const cryptoKeys = {
  all: ['crypto'] as const,
  lists: () => [...cryptoKeys.all, 'list'] as const,
  list: (symbols: string[]) => [...cryptoKeys.lists(), symbols] as const,
  defaults: () => [...cryptoKeys.all, 'defaults'] as const,
  details: () => [...cryptoKeys.all, 'details'] as const,
  detail: (symbol: string) => [...cryptoKeys.details(), symbol] as const,
  searches: () => [...cryptoKeys.all, 'search'] as const,
  search: (params: CryptoSearchParams) => [...cryptoKeys.searches(), params] as const,
};

/**
 * Hook to get a single crypto price
 */
export function useCrypto(symbol: string, enabled = true) {
  return useQuery({
    queryKey: cryptoKeys.detail(symbol),
    queryFn: () => cryptoApi.getCrypto(symbol),
    enabled: !!symbol && enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
  });
}

/**
 * Hook to get multiple crypto prices
 */
export function useCryptos(symbols: string[], enabled = true) {
  return useQuery({
    queryKey: cryptoKeys.list(symbols),
    queryFn: () => cryptoApi.getCryptos(symbols),
    enabled: symbols.length > 0 && enabled,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * Hook to get default cryptos
 */
export function useDefaultCryptos() {
  return useQuery({
    queryKey: cryptoKeys.defaults(),
    queryFn: cryptoApi.getDefaults,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * Hook to search cryptos
 */
export function useCryptoSearch(params: CryptoSearchParams, enabled = true) {
  return useQuery({
    queryKey: cryptoKeys.search(params),
    queryFn: () => cryptoApi.search(params),
    enabled: params.q.length >= 1 && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to invalidate crypto cache
 */
export function useInvalidateCrypto() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: cryptoKeys.all }),
    invalidateCrypto: (symbol: string) => queryClient.invalidateQueries({ queryKey: cryptoKeys.detail(symbol) }),
    invalidateDefaults: () => queryClient.invalidateQueries({ queryKey: cryptoKeys.defaults() }),
  };
}

