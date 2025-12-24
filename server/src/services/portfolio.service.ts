/**
 * Portfolio Service
 * Handles portfolio calculations and price fetching
 */

import { eq, and } from 'drizzle-orm';
import { db, portfolio } from '../db/index.js';
import * as finnhubService from './external-apis/finnhub.service.js';
import * as polygonService from './external-apis/polygon.service.js';
import type { PortfolioEntry } from '../types/index.js';

/**
 * Calculate gain/loss for a portfolio entry
 */
function calculateGainLoss(
  currentPrice: number,
  averagePrice: number,
  shares: number
): { gainLoss: number; gainLossPercent: number } {
  const gainLoss = (currentPrice - averagePrice) * shares;
  const gainLossPercent = averagePrice > 0 
    ? ((currentPrice - averagePrice) / averagePrice) * 100 
    : 0;
  
  return { gainLoss, gainLossPercent };
}

/**
 * Fetch current price for a symbol (Finnhub first, then Polygon fallback)
 */
async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  // Try Finnhub first
  if (finnhubService) {
    const quote = await finnhubService.getStockQuote(symbol).catch(() => null);
    if (quote && quote.price > 0) {
      return quote.price;
    }
  }
  
  // Fallback to Polygon
  const quote = await polygonService.getStockQuote(symbol).catch(() => null);
  if (quote && quote.price > 0) {
    return quote.price;
  }
  
  return null;
}

/**
 * Update current prices for all portfolio entries
 */
export async function updatePortfolioPrices(userId: string): Promise<void> {
  const entries = await db
    .select()
    .from(portfolio)
    .where(eq(portfolio.userId, userId));
  
  for (const entry of entries) {
    const currentPrice = await fetchCurrentPrice(entry.symbol);
    
    if (currentPrice !== null) {
      const shares = Number(entry.shares);
      const avgPrice = Number(entry.averagePrice);
      const { gainLoss, gainLossPercent } = calculateGainLoss(
        currentPrice,
        avgPrice,
        shares
      );
      
      await db
        .update(portfolio)
        .set({
          currentPrice: currentPrice.toString(),
          gainLoss: gainLoss.toString(),
          gainLossPercent: gainLossPercent.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portfolio.userId, userId),
            eq(portfolio.symbol, entry.symbol)
          )
        );
    }
  }
}

/**
 * Get all portfolio entries for a user with updated prices
 */
export async function getUserPortfolio(userId: string): Promise<PortfolioEntry[]> {
  // Update prices first
  await updatePortfolioPrices(userId);
  
  // Fetch updated entries
  const entries = await db
    .select()
    .from(portfolio)
    .where(eq(portfolio.userId, userId));
  
  return entries.map(entry => ({
    userId: entry.userId,
    symbol: entry.symbol,
    shares: Number(entry.shares),
    averagePrice: Number(entry.averagePrice),
    currentPrice: entry.currentPrice ? Number(entry.currentPrice) : 0,
    gainLoss: entry.gainLoss ? Number(entry.gainLoss) : 0,
    gainLossPercent: entry.gainLossPercent ? Number(entry.gainLossPercent) : 0,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}

/**
 * Add or update a portfolio entry
 * If entry exists, recalculate average price based on new purchase
 */
export async function addOrUpdatePortfolioEntry(
  userId: string,
  symbol: string,
  shares: number,
  averagePrice: number
): Promise<PortfolioEntry> {
  const existing = await db
    .select()
    .from(portfolio)
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    )
    .limit(1);
  
  const currentPrice = await fetchCurrentPrice(symbol);
  
  if (existing.length > 0) {
    // Update existing entry - recalculate average price
    const existingShares = Number(existing[0].shares);
    const existingAvgPrice = Number(existing[0].averagePrice);
    
    // Weighted average: (oldShares * oldAvgPrice + newShares * newPrice) / (oldShares + newShares)
    const totalShares = existingShares + shares;
    const totalCost = (existingShares * existingAvgPrice) + (shares * averagePrice);
    const newAveragePrice = totalCost / totalShares;
    
    const finalShares = totalShares;
    const finalAvgPrice = newAveragePrice;
    
    const finalCurrentPrice = currentPrice || finalAvgPrice;
    const { gainLoss, gainLossPercent } = calculateGainLoss(
      finalCurrentPrice,
      finalAvgPrice,
      finalShares
    );
    
    await db
      .update(portfolio)
      .set({
        shares: finalShares.toString(),
        averagePrice: finalAvgPrice.toString(),
        currentPrice: finalCurrentPrice.toString(),
        gainLoss: gainLoss.toString(),
        gainLossPercent: gainLossPercent.toString(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(portfolio.userId, userId),
          eq(portfolio.symbol, symbol)
        )
      );
    
    const updated = await db
      .select()
      .from(portfolio)
      .where(
        and(
          eq(portfolio.userId, userId),
          eq(portfolio.symbol, symbol)
        )
      )
      .limit(1);
    
    return {
      userId: updated[0].userId,
      symbol: updated[0].symbol,
      shares: Number(updated[0].shares),
      averagePrice: Number(updated[0].averagePrice),
      currentPrice: updated[0].currentPrice ? Number(updated[0].currentPrice) : 0,
      gainLoss: updated[0].gainLoss ? Number(updated[0].gainLoss) : 0,
      gainLossPercent: updated[0].gainLossPercent ? Number(updated[0].gainLossPercent) : 0,
      createdAt: updated[0].createdAt,
      updatedAt: updated[0].updatedAt,
    };
  } else {
    // Create new entry
    const finalCurrentPrice = currentPrice || averagePrice;
    const { gainLoss, gainLossPercent } = calculateGainLoss(
      finalCurrentPrice,
      averagePrice,
      shares
    );
    
    await db.insert(portfolio).values({
      userId,
      symbol,
      shares: shares.toString(),
      averagePrice: averagePrice.toString(),
      currentPrice: finalCurrentPrice.toString(),
      gainLoss: gainLoss.toString(),
      gainLossPercent: gainLossPercent.toString(),
    });
    
    const created = await db
      .select()
      .from(portfolio)
      .where(
        and(
          eq(portfolio.userId, userId),
          eq(portfolio.symbol, symbol)
        )
      )
      .limit(1);
    
    return {
      userId: created[0].userId,
      symbol: created[0].symbol,
      shares: Number(created[0].shares),
      averagePrice: Number(created[0].averagePrice),
      currentPrice: created[0].currentPrice ? Number(created[0].currentPrice) : 0,
      gainLoss: created[0].gainLoss ? Number(created[0].gainLoss) : 0,
      gainLossPercent: created[0].gainLossPercent ? Number(created[0].gainLossPercent) : 0,
      createdAt: created[0].createdAt,
      updatedAt: created[0].updatedAt,
    };
  }
}

/**
 * Update portfolio entry (shares or average price)
 */
export async function updatePortfolioEntry(
  userId: string,
  symbol: string,
  updates: { shares?: number; averagePrice?: number }
): Promise<PortfolioEntry> {
  const existing = await db
    .select()
    .from(portfolio)
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    )
    .limit(1);
  
  if (existing.length === 0) {
    throw new Error('Portfolio entry not found');
  }
  
  const currentShares = updates.shares !== undefined ? updates.shares : Number(existing[0].shares);
  const currentAvgPrice = updates.averagePrice !== undefined ? updates.averagePrice : Number(existing[0].averagePrice);
  
  const currentPrice = await fetchCurrentPrice(symbol);
  const finalCurrentPrice = currentPrice || currentAvgPrice;
  
  const { gainLoss, gainLossPercent } = calculateGainLoss(
    finalCurrentPrice,
    currentAvgPrice,
    currentShares
  );
  
  await db
    .update(portfolio)
    .set({
      ...(updates.shares !== undefined && { shares: updates.shares.toString() }),
      ...(updates.averagePrice !== undefined && { averagePrice: updates.averagePrice.toString() }),
      currentPrice: finalCurrentPrice.toString(),
      gainLoss: gainLoss.toString(),
      gainLossPercent: gainLossPercent.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    );
  
  const updated = await db
    .select()
    .from(portfolio)
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    )
    .limit(1);
  
  return {
    userId: updated[0].userId,
    symbol: updated[0].symbol,
    shares: Number(updated[0].shares),
    averagePrice: Number(updated[0].averagePrice),
    currentPrice: updated[0].currentPrice ? Number(updated[0].currentPrice) : 0,
    gainLoss: updated[0].gainLoss ? Number(updated[0].gainLoss) : 0,
    gainLossPercent: updated[0].gainLossPercent ? Number(updated[0].gainLossPercent) : 0,
    createdAt: updated[0].createdAt,
    updatedAt: updated[0].updatedAt,
  };
}

/**
 * Delete portfolio entry
 */
export async function deletePortfolioEntry(
  userId: string,
  symbol: string
): Promise<void> {
  await db
    .delete(portfolio)
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    );
}

