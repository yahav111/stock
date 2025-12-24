/**
 * Stocks Controller
 * Handles all stock-related API requests
 */

import type { Request, Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { ApiError } from '../../lib/api-error.js';
import * as polygonService from '../../services/external-apis/polygon.service.js';
import * as finnhubService from '../../services/external-apis/finnhub.service.js';
import { env } from '../../config/env.js';
import { DEFAULT_STOCKS } from '../../config/constants.js';
import type {
  GetStockParams,
  GetStocksQuery,
  GetHistoryParams,
  GetHistoryQuery,
  SearchQuery,
} from '../validators/stocks.validators.js';

/**
 * GET /api/stocks/:symbol
 * Get a single stock quote
 * Uses Finnhub for current price (preferred), falls back to Polygon
 */
export async function getStock(
  req: Request<GetStockParams>,
  res: Response
) {
  const { symbol } = req.params;
  
  // Prefer Finnhub for current price (real-time), fallback to Polygon
  let quote = null;
  if (env.FINNHUB_API_KEY) {
    quote = await finnhubService.getStockQuote(symbol).catch(() => null);
  }
  
  if (!quote) {
    quote = await polygonService.getStockQuote(symbol);
  }
  
  if (!quote) {
    throw ApiError.notFound(`Stock ${symbol}`);
  }
  
  res.status(HttpStatus.OK).json(successResponse(quote));
}

/**
 * GET /api/stocks?symbols=AAPL,GOOGL
 * Get multiple stock quotes
 */
export async function getStocks(
  req: Request<object, object, object, GetStocksQuery>,
  res: Response
) {
  const { symbols } = req.query;
  
  const quotes = await polygonService.getMultipleStockQuotes(symbols);
  
  res.status(HttpStatus.OK).json(successResponse(quotes, {
    total: quotes.length,
  }));
}

/**
 * GET /api/stocks/defaults
 * Get default stock quotes
 */
export async function getDefaults(_req: Request, res: Response) {
  console.log(`📊 [REST API] /stocks/defaults - Using Polygon for ${DEFAULT_STOCKS.length} stocks`);
  const quotes = await polygonService.getMultipleStockQuotes(DEFAULT_STOCKS);
  
  if (quotes.length > 0) {
    const sample = quotes[0];
    console.log(`📊 [REST API] Sample: ${sample.symbol} = $${sample.price.toFixed(2)} - Source: Polygon (previous day)`);
  }
  
  res.status(HttpStatus.OK).json(successResponse(quotes, {
    total: quotes.length,
  }));
}

/**
 * GET /api/stocks/:symbol/history
 * Get historical OHLC data
 */
export async function getHistory(
  req: Request<GetHistoryParams, object, object, GetHistoryQuery>,
  res: Response
) {
  const { symbol } = req.params;
  const { timespan, limit } = req.query;
  
  const history = await polygonService.getStockHistory(symbol, timespan, limit);
  
  res.status(HttpStatus.OK).json(successResponse(history, {
    total: history.length,
  }));
}

/**
 * GET /api/stocks/:symbol/details
 * Get detailed stock information
 */
export async function getDetails(
  req: Request<GetStockParams>,
  res: Response
) {
  const { symbol } = req.params;
  
  const details = await polygonService.getStockDetails(symbol);
  
  if (!details) {
    throw ApiError.notFound(`Stock details for ${symbol}`);
  }
  
  res.status(HttpStatus.OK).json(successResponse(details));
}

/**
 * GET /api/stocks/search?q=apple
 * Search for stocks
 */
export async function search(
  req: Request<object, object, object, SearchQuery>,
  res: Response
) {
  const { q, limit } = req.query;
  
  const results = await polygonService.searchStocks(q, limit);
  
  res.status(HttpStatus.OK).json(successResponse(results, {
    total: results.length,
  }));
}

