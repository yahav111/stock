/**
 * Crypto Controller
 * Handles all cryptocurrency-related API requests
 */

import type { Request, Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { ApiError } from '../../lib/api-error.js';
import * as cryptoService from '../../services/external-apis/cryptocompare.service.js';
import { DEFAULT_CRYPTOS } from '../../config/constants.js';
import type {
  GetCryptoParams,
  GetCryptosQuery,
  SearchQuery,
} from '../validators/crypto.validators.js';

/**
 * GET /api/crypto/:symbol
 * Get a single cryptocurrency price
 */
export async function getCrypto(
  req: Request<GetCryptoParams>,
  res: Response
) {
  const { symbol } = req.params;
  
  const crypto = await cryptoService.getCryptoPrice(symbol);
  
  if (!crypto) {
    throw ApiError.notFound(`Cryptocurrency ${symbol}`);
  }
  
  res.status(HttpStatus.OK).json(successResponse(crypto));
}

/**
 * GET /api/crypto?symbols=BTC,ETH
 * Get multiple cryptocurrency prices
 */
export async function getCryptos(
  req: Request<object, object, object, GetCryptosQuery>,
  res: Response
) {
  const { symbols } = req.query;
  
  const cryptos = await cryptoService.getMultipleCryptoPrices(symbols);
  
  res.status(HttpStatus.OK).json(successResponse(cryptos, {
    total: cryptos.length,
  }));
}

/**
 * GET /api/crypto/defaults
 * Get default cryptocurrency prices
 */
export async function getDefaults(_req: Request, res: Response) {
  const cryptos = await cryptoService.getMultipleCryptoPrices(DEFAULT_CRYPTOS);
  
  res.status(HttpStatus.OK).json(successResponse(cryptos, {
    total: cryptos.length,
  }));
}

/**
 * GET /api/crypto/search?q=bitcoin
 * Search for cryptocurrencies
 */
export async function search(
  req: Request<object, object, object, SearchQuery>,
  res: Response
) {
  const { q, limit } = req.query;
  
  const results = await cryptoService.searchCrypto(q, limit);
  
  res.status(HttpStatus.OK).json(successResponse(results, {
    total: results.length,
  }));
}

