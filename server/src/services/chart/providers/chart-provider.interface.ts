/**
 * Chart Provider Interface
 * Adapter pattern - all providers must implement this
 */
import type { HistoricalBar, ChartDataParams } from '../types.js';

export interface IChartProvider {
  /**
   * Get historical OHLC data for a symbol
   * @param params - Chart data parameters
   * @returns Array of historical bars
   */
  getHistory(params: ChartDataParams): Promise<HistoricalBar[]>;

  /**
   * Get current quote/price for a symbol
   * @param symbol - Symbol to get quote for
   * @returns Current price and change data
   */
  getQuote(symbol: string): Promise<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
    name?: string;
  } | null>;

  /**
   * Check if provider supports a symbol
   * @param symbol - Symbol to check
   */
  supports(symbol: string): boolean;
}

