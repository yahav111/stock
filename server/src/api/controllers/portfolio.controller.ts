/**
 * Portfolio Controller
 * Handles all portfolio-related API requests
 */

import type { Response } from 'express';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { ApiError } from '../../lib/api-error.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as portfolioService from '../../services/portfolio.service.js';
import type {
  GetPortfolioParams,
  AddPortfolioBody,
  UpdatePortfolioBody,
  SetInitialCashBody,
} from '../validators/portfolio.validators.js';

/**
 * GET /api/portfolio
 * Get all portfolio entries for the authenticated user
 */
export async function getPortfolio(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.user.id;
  const entries = await portfolioService.getUserPortfolio(userId);
  const balance = await portfolioService.getPortfolioBalance(userId);
  
  // Calculate totals (only on invested amount, not including cash)
  const totalValue = entries.reduce((sum, entry) => sum + (entry.currentPrice * entry.shares), 0);
  const totalCost = entries.reduce((sum, entry) => sum + (entry.averagePrice * entry.shares), 0);
  const totalGainLoss = entries.reduce((sum, entry) => sum + entry.gainLoss, 0);
  const totalGainLossPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  
  res.status(HttpStatus.OK).json(successResponse({
    entries,
    summary: {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
    },
    balance: {
      initialCash: balance.initialCash,
      cash: balance.cash,
      invested: balance.invested,
    },
  }));
}

/**
 * POST /api/portfolio
 * Add a new stock to portfolio or update existing (buy more shares)
 */
export async function addPortfolioEntry(
  req: AuthenticatedRequest<object, object, AddPortfolioBody>,
  res: Response
) {
  const userId = req.user.id;
  const { symbol, shares, averagePrice } = req.body;
  
  const entry = await portfolioService.addOrUpdatePortfolioEntry(
    userId,
    symbol,
    shares,
    averagePrice
  );
  
  res.status(HttpStatus.CREATED).json(successResponse(entry));
}

/**
 * PUT /api/portfolio/:symbol
 * Update portfolio entry (shares or averagePrice)
 */
export async function updatePortfolioEntry(
  req: AuthenticatedRequest<GetPortfolioParams, object, UpdatePortfolioBody>,
  res: Response
) {
  const userId = req.user.id;
  const { symbol } = req.params;
  const { shares, averagePrice } = req.body;
  
  if (!shares && !averagePrice) {
    throw ApiError.badRequest('Must provide either shares or averagePrice to update');
  }
  
  const entry = await portfolioService.updatePortfolioEntry(userId, symbol, {
    shares,
    averagePrice,
  });
  
  res.status(HttpStatus.OK).json(successResponse(entry));
}

/**
 * DELETE /api/portfolio/:symbol
 * Remove a stock from portfolio
 */
export async function deletePortfolioEntry(
  req: AuthenticatedRequest<GetPortfolioParams>,
  res: Response
) {
  const userId = req.user.id;
  const { symbol } = req.params;
  
  await portfolioService.deletePortfolioEntry(userId, symbol);
  
  res.status(HttpStatus.OK).json(successResponse({ message: 'Portfolio entry deleted' }));
}

/**
 * POST /api/portfolio/initial-cash
 * Set initial cash amount for the portfolio
 */
export async function setInitialCash(
  req: AuthenticatedRequest<object, object, SetInitialCashBody>,
  res: Response
) {
  const userId = req.user.id;
  const { initialCash } = req.body;
  
  await portfolioService.setInitialCash(userId, initialCash);
  
  const balance = await portfolioService.getPortfolioBalance(userId);
  
  res.status(HttpStatus.OK).json(successResponse({
    initialCash: balance.initialCash,
    cash: balance.cash,
    invested: balance.invested,
  }));
}

/**
 * GET /api/portfolio/balance
 * Get portfolio balance (cash and invested)
 */
export async function getPortfolioBalance(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.user.id;
  const balance = await portfolioService.getPortfolioBalance(userId);
  
  res.status(HttpStatus.OK).json(successResponse({
    initialCash: balance.initialCash,
    cash: balance.cash,
    invested: balance.invested,
  }));
}

