/**
 * Stock Chart Provider
 * Adapter for Polygon.io stock data
 */
import type { IChartProvider } from './chart-provider.interface.js';
import type { HistoricalBar, ChartDataParams } from '../types.js';
import * as polygonService from '../../external-apis/polygon.service.js';
import { isStock } from '../symbol-detector.js';

export class StockChartProvider implements IChartProvider {
  supports(symbol: string): boolean {
    return isStock(symbol);
  }

  async getHistory(params: ChartDataParams): Promise<HistoricalBar[]> {
    const { symbol, timespan, limit } = params;
    
    // Use existing Polygon service
    const history = await polygonService.getStockHistory(
      symbol,
      timespan,
      limit
    );

    // Convert to unified format (already in correct format, but ensure consistency)
    return history.map(bar => ({
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));
  }

  async getQuote(symbol: string) {
    const quote = await polygonService.getStockQuote(symbol);
    
    if (!quote) return null;

    const details = await polygonService.getStockDetails(symbol).catch(() => null);

    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      timestamp: quote.timestamp,
      name: details?.name,
    };
  }
}

