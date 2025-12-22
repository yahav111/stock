/**
 * Chart Service
 * Central orchestrator that decides which provider to use
 * Frontend doesn't know if it's crypto or stock - backend decides
 */
import type { ChartDataParams, ChartDataResponse } from './types.js';
import { detectSymbolType } from './symbol-detector.js';
import { StockChartProvider } from './providers/stock-chart-provider.js';
import { CryptoChartProvider } from './providers/crypto-chart-provider.js';
import type { IChartProvider } from './providers/chart-provider.interface.js';

class ChartService {
  private providers: IChartProvider[];

  constructor() {
    // Initialize providers
    this.providers = [
      new StockChartProvider(),
      new CryptoChartProvider(),
    ];
  }

  /**
   * Get the appropriate provider for a symbol
   */
  private getProvider(symbol: string): IChartProvider {
    const provider = this.providers.find(p => p.supports(symbol));
    
    if (!provider) {
      // Default to stock provider if no match
      return this.providers[0];
    }

    return provider;
  }

  /**
   * Get chart data (history + quote) for a symbol
   * Automatically detects if symbol is crypto or stock
   */
  async getChartData(params: ChartDataParams): Promise<ChartDataResponse> {
    const { symbol } = params;
    const symbolType = detectSymbolType(symbol);
    
    console.log(`📊 Chart Service: ${symbol} detected as ${symbolType}`);

    const provider = this.getProvider(symbol);
    
    // Fetch history and quote in parallel
    const [bars, quote] = await Promise.all([
      provider.getHistory(params),
      provider.getQuote(symbol),
    ]);

    return {
      symbol: symbol.toUpperCase(),
      type: symbolType,
      bars,
      name: quote?.name,
    };
  }

  /**
   * Get only historical bars
   */
  async getHistory(params: ChartDataParams) {
    const provider = this.getProvider(params.symbol);
    return provider.getHistory(params);
  }

  /**
   * Get only current quote
   */
  async getQuote(symbol: string) {
    const provider = this.getProvider(symbol);
    return provider.getQuote(symbol);
  }
}

// Export singleton instance
export const chartService = new ChartService();

