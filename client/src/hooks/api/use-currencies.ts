/**
 * Currencies React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currenciesApi, type ConvertParams } from '../../lib/api';

// Query keys
export const currenciesKeys = {
  all: ['currencies'] as const,
  rates: () => [...currenciesKeys.all, 'rates'] as const,
  ratesBase: (base: string) => [...currenciesKeys.rates(), base] as const,
  defaults: () => [...currenciesKeys.all, 'defaults'] as const,
  pairs: () => [...currenciesKeys.all, 'pairs'] as const,
  pairsList: (pairs: string[]) => [...currenciesKeys.pairs(), pairs] as const,
  convert: () => [...currenciesKeys.all, 'convert'] as const,
};

/**
 * Hook to get exchange rates
 */
export function useExchangeRates(base: string = 'USD') {
  return useQuery({
    queryKey: currenciesKeys.ratesBase(base),
    queryFn: () => currenciesApi.getRates(base),
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000,
  });
}

/**
 * Hook to get default currency rates
 */
export function useDefaultRates() {
  return useQuery({
    queryKey: currenciesKeys.defaults(),
    queryFn: currenciesApi.getDefaults,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });
}

/**
 * Hook to get currency pairs
 */
export function useCurrencyPairs(pairs: string[], enabled = true) {
  return useQuery({
    queryKey: currenciesKeys.pairsList(pairs),
    queryFn: () => currenciesApi.getPairs(pairs),
    enabled: pairs.length > 0 && enabled,
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Hook to convert currencies
 */
export function useConvertCurrency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: ConvertParams) => currenciesApi.convert(params),
    onSuccess: () => {
      // Optionally invalidate rates cache
    },
  });
}

/**
 * Hook to convert with caching (for repeated conversions)
 */
export function useCachedConversion(params: ConvertParams | null) {
  return useQuery({
    queryKey: [...currenciesKeys.convert(), params],
    queryFn: () => params ? currenciesApi.convert(params) : null,
    enabled: !!params && params.amount > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to invalidate currencies cache
 */
export function useInvalidateCurrencies() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: currenciesKeys.all }),
    invalidateRates: () => queryClient.invalidateQueries({ queryKey: currenciesKeys.rates() }),
  };
}

