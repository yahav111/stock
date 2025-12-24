/**
 * useNews Hook
 * Fetches market news from Finnhub API
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/api/client'
import type { MarketNews } from '../../types'
import type { ApiResponse } from '../../lib/api/client'

interface UseNewsOptions {
  category?: 'general' | 'forex' | 'crypto' | 'merger'
  minId?: number
  enabled?: boolean
  refetchInterval?: number // Polling interval in milliseconds (default: 2-3 minutes)
}

export function useNews(options: UseNewsOptions = {}) {
  const {
    category = 'general',
    minId,
    enabled = true,
    refetchInterval = 2.5 * 60 * 1000, // 2.5 minutes default
  } = options

  return useQuery({
    queryKey: ['news', category, minId],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('category', category)
      if (minId) {
        params.append('minId', minId.toString())
      }

      const response = await apiClient.get<ApiResponse<MarketNews[]>>(
        `/news?${params.toString()}`
      )

      if (!response.data.success) {
        throw new Error('Failed to fetch news')
      }

      if (!response.data.data) {
        throw new Error('No news data available')
      }

      return response.data.data
    },
    enabled,
    refetchInterval, // Poll every 2-3 minutes
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })
}

/**
 * Hook for loading more news (pagination)
 * Returns a function to fetch older news
 */
export function useLoadMoreNews() {
  const queryClient = useQueryClient()

  return async (category: string, currentMinId: number) => {
    const queryKey = ['news', category, currentMinId]
    
    // Check if already cached
    const cached = queryClient.getQueryData<MarketNews[]>(queryKey)
    if (cached) {
      return cached
    }

    // Fetch new data
    const params = new URLSearchParams()
    params.append('category', category)
    params.append('minId', currentMinId.toString())

    const response = await apiClient.get<ApiResponse<MarketNews[]>>(
      `/news?${params.toString()}`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to load more news')
    }

    // Cache the result
    queryClient.setQueryData(queryKey, response.data.data)
    
    return response.data.data
  }
}

