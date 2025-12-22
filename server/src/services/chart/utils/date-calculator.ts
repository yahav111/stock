/**
 * Date Calculator
 * Calculates dynamic date ranges for chart data
 * Always uses current date - no hardcoded dates
 */

/**
 * Calculate date range for chart data
 * @param timespan - 'day', 'week', or 'month'
 * @param limit - Number of periods to fetch
 * @returns { from: Date, to: Date } - Date range (from is inclusive, to is exclusive for stocks)
 */
export function calculateDateRange(
  timespan: 'day' | 'week' | 'month',
  limit: number
): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  // For stocks: use yesterday as 'to' (market closes at end of day)
  // For crypto: use today (markets are 24/7)
  // We'll use today for both and let the API handle it
  to.setHours(23, 59, 59, 999); // End of today

  // Calculate 'from' based on timespan
  if (timespan === 'day') {
    // For daily: go back 'limit' days
    // Add extra days for weekends (stocks don't trade on weekends)
    const extraDays = Math.ceil(limit * 0.3); // ~30% extra for weekends
    from.setDate(from.getDate() - limit - extraDays);
  } else if (timespan === 'week') {
    // For weekly: go back 'limit' weeks
    from.setDate(from.getDate() - (limit * 7));
  } else if (timespan === 'month') {
    // For monthly: go back 'limit' months
    from.setMonth(from.getMonth() - limit);
  }

  // Set to start of day
  from.setHours(0, 0, 0, 0);

  return { from, to };
}

/**
 * Get cache key with date to ensure freshness
 * @param prefix - Cache key prefix (e.g., 'crypto-history')
 * @param symbol - Symbol
 * @param timespan - Timespan
 * @param limit - Limit
 * @returns Cache key with current date
 */
export function getCacheKeyWithDate(
  prefix: string,
  symbol: string,
  timespan: 'day' | 'week' | 'month',
  limit: number
): string {
  // Include date in cache key to ensure daily refresh
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}:${symbol}:${timespan}:${limit}:${today}`;
}

/**
 * Check if cache is stale based on timespan
 * @param cacheTimestamp - When cache was created
 * @param timespan - 'day', 'week', or 'month'
 * @returns true if cache should be refreshed
 */
export function isCacheStale(
  cacheTimestamp: number,
  timespan: 'day' | 'week' | 'month'
): boolean {
  const now = Date.now();
  const age = now - cacheTimestamp;

  // Cache TTL based on timespan
  const ttl = {
    day: 60 * 60 * 1000,      // 1 hour for daily (updates every day)
    week: 6 * 60 * 60 * 1000, // 6 hours for weekly (updates once a week)
    month: 24 * 60 * 60 * 1000, // 24 hours for monthly (updates once a month)
  }[timespan];

  return age > ttl;
}

