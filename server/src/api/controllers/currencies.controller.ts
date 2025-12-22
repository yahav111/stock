/**
 * Currencies Controller
 * Handles all currency-related API requests
 */

import type { Request, Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import * as currencyService from '../../services/external-apis/openexchange.service.js';
import { DEFAULT_CURRENCIES } from '../../config/constants.js';
import type {
  GetRatesQuery,
  ConvertBody,
  GetPairsQuery,
} from '../validators/currencies.validators.js';

/**
 * GET /api/currencies/rates
 * Get exchange rates
 */
export async function getRates(
  req: Request<object, object, object, GetRatesQuery>,
  res: Response
) {
  const { base } = req.query;
  
  const rates = await currencyService.getExchangeRates(base);
  
  res.status(HttpStatus.OK).json(successResponse(rates));
}

/**
 * POST /api/currencies/convert
 * Convert between currencies
 */
export async function convert(
  req: Request<object, object, ConvertBody>,
  res: Response
) {
  const { amount, from, to } = req.body;
  
  const result = await currencyService.convertCurrency(amount, from, to);
  
  res.status(HttpStatus.OK).json(successResponse({
    from,
    to,
    amount,
    convertedAmount: result.amount,
    rate: result.rate,
    timestamp: Date.now(),
  }));
}

/**
 * GET /api/currencies/pairs?pairs=EURUSD,GBPUSD
 * Get specific currency pairs
 */
export async function getPairs(
  req: Request<object, object, object, GetPairsQuery>,
  res: Response
) {
  const { pairs } = req.query;
  
  const results = await currencyService.getCurrencyPairs(pairs);
  
  res.status(HttpStatus.OK).json(successResponse(results, {
    total: results.length,
  }));
}

/**
 * GET /api/currencies/defaults
 * Get default currency rates
 */
export async function getDefaults(_req: Request, res: Response) {
  const rates = await currencyService.getExchangeRates('USD');
  
  // Filter to only default currencies
  const filteredRates: Record<string, number> = {};
  DEFAULT_CURRENCIES.forEach((currency) => {
    if (rates[currency]) {
      filteredRates[currency] = rates[currency];
    }
  });
  
  res.status(HttpStatus.OK).json(successResponse({
    base: 'USD',
    rates: filteredRates,
    timestamp: Date.now(),
  }));
}

