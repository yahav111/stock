/**
 * Stock Chart Provider
 * Adapter for Polygon.io stock data
 */
import type { IChartProvider } from './chart-provider.interface.js';
import type { HistoricalBar, ChartDataParams } from '../types.js';
import * as polygonService from '../../external-apis/polygon.service.js';
import * as finnhubService from '../../external-apis/finnhub.service.js';
import { env } from '../../../config/env.js';
import { isStock } from '../symbol-detector.js';

export class StockChartProvider implements IChartProvider {
  supports(symbol: string): boolean {
    return isStock(symbol);
  }

  async getHistory(params: ChartDataParams): Promise<HistoricalBar[]> {
    const { symbol, timespan, limit } = params;
    
    // Use existing Polygon service
    let history = await polygonService.getStockHistory(
      symbol,
      timespan,
      limit
    );

    // Convert to unified format (already in correct format, but ensure consistency)
    history = history.map(bar => ({
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));

    // Check if we need to add/update today's bar
    // Only for daily timeframe when market might still be open
    if (timespan === 'day' && history.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayBarTime = Math.floor(todayStart.getTime() / 1000);
      
      // Check if today is a trading day (not weekend)
      const isTradingDay = today.getDay() !== 0 && today.getDay() !== 6;
      
      // Always try to add/update today's bar if it's a trading day
      // This ensures the bar is updated with latest price even if it already exists
      if (isTradingDay) {
        try {
          // Prefer Finnhub for current price if available, otherwise fallback to Polygon
          let quote = null;
          let quoteSource = 'none';
          if (env.FINNHUB_API_KEY) {
            quote = await finnhubService.getStockQuote(symbol).catch(() => null);
            if (quote) quoteSource = 'Finnhub';
          }
          if (!quote) {
            quote = await polygonService.getStockQuote(symbol).catch(() => null);
            if (quote) quoteSource = 'Polygon';
          }
          
          if (quote) {
            console.log(`📊 Using ${quoteSource} quote for ${symbol} today's bar: $${quote.price.toFixed(2)}`);
          }
          
          // Get stock details (has open/high/low) from Polygon
          const details = await polygonService.getStockDetails(symbol).catch(() => null);
          
          if (quote) {
            // Get yesterday's close - if today's bar exists, use the bar before it
            const existingTodayBarIndex = history.findIndex(bar => bar.time === todayBarTime);
            let yesterdayClose: number;
            if (existingTodayBarIndex !== -1 && existingTodayBarIndex > 0) {
              // Today's bar exists, use the bar before it
              yesterdayClose = history[existingTodayBarIndex - 1].close;
            } else {
              // Today's bar doesn't exist, use last bar's close
              yesterdayClose = history[history.length - 1].close;
            }
            const currentPrice = quote.price;
            
            // Use details if available (has open/high/low from today's trading), otherwise use approximations
            let open = yesterdayClose;
            let high = Math.max(yesterdayClose, currentPrice * 1.01);
            let low = Math.min(yesterdayClose, currentPrice * 0.99);
            
            if (details && details.open !== undefined && details.high !== undefined && details.low !== undefined) {
              // Use details if they exist (might be from today's trading session)
              open = details.open;
              high = details.high;
              low = details.low;
            } else {
              // Otherwise, use yesterday's close as open and approximate high/low
              open = yesterdayClose;
              high = Math.max(yesterdayClose, currentPrice * 1.02); // Add small buffer for high
              low = Math.min(yesterdayClose, currentPrice * 0.98); // Add small buffer for low
            }
            
            // Create today's bar
            const todayBar: HistoricalBar = {
              time: todayBarTime,
              open,
              high,
              low,
              close: currentPrice,
              volume: quote.volume || (details?.volume || 0),
            };
            
            // Update or add today's bar (existingTodayBarIndex was already found above)
            if (existingTodayBarIndex === -1) {
              // No bar for today, add it
              history.push(todayBar);
              console.log(`✅ Added today's bar (${todayStr}) for ${symbol}: open=${open.toFixed(2)}, high=${high.toFixed(2)}, low=${low.toFixed(2)}, close=${currentPrice.toFixed(2)}`);
            } else {
              // Bar for today exists, update it with latest data
              history[existingTodayBarIndex] = todayBar;
              console.log(`🔄 Updated today's bar (${todayStr}) for ${symbol}: open=${open.toFixed(2)}, high=${high.toFixed(2)}, low=${low.toFixed(2)}, close=${currentPrice.toFixed(2)}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not add today's bar for ${symbol}:`, error);
          // Continue without today's bar if fetch fails
        }
      }
    }

    // Sort by time to ensure proper ordering (remove duplicates based on time)
    const seenTimes = new Set<number>();
    const uniqueHistory = history.filter(bar => {
      if (seenTimes.has(bar.time)) {
        console.warn(`⚠️ Duplicate bar found for ${symbol} at time ${bar.time}, removing duplicate`);
        return false;
      }
      seenTimes.add(bar.time);
      return true;
    });
    
    // Sort by time (ascending)
    uniqueHistory.sort((a, b) => a.time - b.time);

    return uniqueHistory;
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

