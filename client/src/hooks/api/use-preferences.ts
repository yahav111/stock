/**
 * Preferences React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesApi, type UpdatePreferencesParams, type WatchlistUpdateParams } from '../../lib/api';
import { useDashboardStore } from '../../stores/dashboard-store';

// Query keys
export const preferencesKeys = {
  all: ['preferences'] as const,
  user: () => [...preferencesKeys.all, 'user'] as const,
};

/**
 * Hook to get user preferences
 */
export function usePreferences(enabled = true) {
  const { setWatchlistStocks, setWatchlistCrypto, setFavoriteCurrencies } = useDashboardStore();
  
  return useQuery({
    queryKey: preferencesKeys.user(),
    queryFn: async () => {
      const prefs = await preferencesApi.getPreferences();
      // Sync with dashboard store
      setWatchlistStocks(prefs.watchlistStocks);
      setWatchlistCrypto(prefs.watchlistCrypto);
      setFavoriteCurrencies(prefs.favoriteCurrencies);
      return prefs;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: UpdatePreferencesParams) => preferencesApi.updatePreferences(params),
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKeys.user(), data);
    },
  });
}

/**
 * Hook to reset preferences
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => preferencesApi.resetPreferences(),
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKeys.user(), data);
    },
  });
}

/**
 * Hook to update stock watchlist
 */
export function useUpdateStockWatchlist() {
  const queryClient = useQueryClient();
  const { setWatchlistStocks } = useDashboardStore();
  
  return useMutation({
    mutationFn: (params: WatchlistUpdateParams) => {
      console.log('[PREFERENCES] Updating stock watchlist with params:', params);
      return preferencesApi.updateStockWatchlist(params);
    },
    onSuccess: (data) => {
      console.log('[PREFERENCES] Stock watchlist updated successfully:', data);
      setWatchlistStocks(data.watchlistStocks);
      queryClient.invalidateQueries({ queryKey: preferencesKeys.user() });
    },
    onError: (error) => {
      console.error('[PREFERENCES] Error updating stock watchlist:', error);
    },
  });
}

/**
 * Hook to update crypto watchlist
 */
export function useUpdateCryptoWatchlist() {
  const queryClient = useQueryClient();
  const { setWatchlistCrypto } = useDashboardStore();
  
  return useMutation({
    mutationFn: (params: WatchlistUpdateParams) => {
      console.log('[PREFERENCES] Updating crypto watchlist with params:', params);
      return preferencesApi.updateCryptoWatchlist(params);
    },
    onSuccess: (data) => {
      console.log('[PREFERENCES] Crypto watchlist updated successfully:', data);
      setWatchlistCrypto(data.watchlistCrypto);
      queryClient.invalidateQueries({ queryKey: preferencesKeys.user() });
    },
    onError: (error) => {
      console.error('[PREFERENCES] Error updating crypto watchlist:', error);
    },
  });
}

/**
 * Hook to add stock to watchlist
 */
export function useAddToStockWatchlist() {
  const updateWatchlist = useUpdateStockWatchlist();
  
  return {
    addStock: (symbol: string) => updateWatchlist.mutate({ add: [symbol.toUpperCase()] }),
    removeStock: (symbol: string) => updateWatchlist.mutate({ remove: [symbol.toUpperCase()] }),
    isPending: updateWatchlist.isPending,
    error: updateWatchlist.error,
  };
}

/**
 * Hook to add crypto to watchlist
 */
export function useAddToCryptoWatchlist() {
  const updateWatchlist = useUpdateCryptoWatchlist();
  
  return {
    addCrypto: (symbol: string) => updateWatchlist.mutate({ add: [symbol.toUpperCase()] }),
    removeCrypto: (symbol: string) => updateWatchlist.mutate({ remove: [symbol.toUpperCase()] }),
    isPending: updateWatchlist.isPending,
    error: updateWatchlist.error,
  };
}

