/**
 * Portfolio Service
 * Handles portfolio calculations and price fetching
 */

import { eq, and } from 'drizzle-orm';
import { db, portfolio, portfolioBalance } from '../db/index.js';
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
 * Get or create portfolio balance for a user
 */
async function getOrCreatePortfolioBalance(userId: string) {
  try {
    const existing = await db
      .select()
      .from(portfolioBalance)
      .where(eq(portfolioBalance.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return {
        initialCash: Number(existing[0].initialCash),
        cash: Number(existing[0].cash),
        invested: Number(existing[0].invested),
      };
    }
    
    // Create new balance with default values
    try {
      await db.insert(portfolioBalance).values({
        userId,
        initialCash: '0',
        cash: '0',
        invested: '0',
      });
    } catch (insertError: any) {
      // If insert fails (e.g., duplicate key), try to fetch again
      if (insertError?.code === '23505' || insertError?.message?.includes('unique')) {
        const retry = await db
          .select()
          .from(portfolioBalance)
          .where(eq(portfolioBalance.userId, userId))
          .limit(1);
        
        if (retry.length > 0) {
          return {
            initialCash: Number(retry[0].initialCash),
            cash: Number(retry[0].cash),
            invested: Number(retry[0].invested),
          };
        }
      }
      throw insertError;
    }
    
    return {
      initialCash: 0,
      cash: 0,
      invested: 0,
    };
  } catch (error: any) {
    // If table doesn't exist, return default values
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('⚠️ portfolio_balance table does not exist. Please run migration.');
      return {
        initialCash: 0,
        cash: 0,
        invested: 0,
      };
    }
    throw error;
  }
}

/**
 * Update portfolio balance
 */
async function updatePortfolioBalance(
  userId: string,
  updates: { initialCash?: number; cash?: number; invested?: number }
): Promise<void> {
  const updateData: Record<string, string | Date> = {
    updatedAt: new Date(),
  };
  
  if (updates.initialCash !== undefined) {
    updateData.initialCash = updates.initialCash.toString();
  }
  if (updates.cash !== undefined) {
    updateData.cash = updates.cash.toString();
  }
  if (updates.invested !== undefined) {
    updateData.invested = updates.invested.toString();
  }
  
  await db
    .update(portfolioBalance)
    .set(updateData)
    .where(eq(portfolioBalance.userId, userId));
}

/**
 * Recalculate invested amount from all portfolio entries
 */
async function recalculateInvested(userId: string): Promise<number> {
  const entries = await db
    .select()
    .from(portfolio)
    .where(eq(portfolio.userId, userId));
  
  const totalInvested = entries.reduce((sum, entry) => {
    return sum + (Number(entry.averagePrice) * Number(entry.shares));
  }, 0);
  
  return totalInvested;
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
  // Get portfolio balance
  const balance = await getOrCreatePortfolioBalance(userId);
  
  // Calculate investment amount for new shares
  const investmentAmount = shares * averagePrice;
  
  // Check if user has enough cash
  if (balance.cash < investmentAmount) {
    throw new Error(`Insufficient cash. Available: ${balance.cash.toFixed(2)}, Required: ${investmentAmount.toFixed(2)}`);
  }
  
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
    const existingInvested = existingShares * existingAvgPrice;
    
    // Weighted average: (oldShares * oldAvgPrice + newShares * newPrice) / (oldShares + newShares)
    const totalShares = existingShares + shares;
    const totalCost = existingInvested + investmentAmount;
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
    
    // Update balance: reduce cash, increase invested
    const newInvested = await recalculateInvested(userId);
    await updatePortfolioBalance(userId, {
      cash: balance.cash - investmentAmount,
      invested: newInvested,
    });
    
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
    
    // Update balance: reduce cash, increase invested
    const newInvested = await recalculateInvested(userId);
    await updatePortfolioBalance(userId, {
      cash: balance.cash - investmentAmount,
      invested: newInvested,
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
  const balance = await getOrCreatePortfolioBalance(userId);
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
  
  const oldShares = Number(existing[0].shares);
  const oldAvgPrice = Number(existing[0].averagePrice);
  const oldInvested = oldShares * oldAvgPrice;
  
  const currentShares = updates.shares !== undefined ? updates.shares : oldShares;
  const currentAvgPrice = updates.averagePrice !== undefined ? updates.averagePrice : oldAvgPrice;
  const newInvested = currentShares * currentAvgPrice;
  
  // Calculate difference in investment
  const investmentDiff = newInvested - oldInvested;
  
  // If increasing investment, check cash
  if (investmentDiff > 0 && balance.cash < investmentDiff) {
    throw new Error(`Insufficient cash. Available: ${balance.cash.toFixed(2)}, Required: ${investmentDiff.toFixed(2)}`);
  }
  
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
  
  // Update balance
  const totalInvested = await recalculateInvested(userId);
  await updatePortfolioBalance(userId, {
    cash: balance.cash - investmentDiff,
    invested: totalInvested,
  });
  
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
  const balance = await getOrCreatePortfolioBalance(userId);
  
  // Get entry to calculate how much to return to cash
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
  
  const investedAmount = Number(existing[0].shares) * Number(existing[0].averagePrice);
  
  // Delete entry
  await db
    .delete(portfolio)
    .where(
      and(
        eq(portfolio.userId, userId),
        eq(portfolio.symbol, symbol)
      )
    );
  
  // Update balance: return cash, reduce invested
  const newInvested = await recalculateInvested(userId);
  await updatePortfolioBalance(userId, {
    cash: balance.cash + investedAmount,
    invested: newInvested,
  });
}

/**
 * Get portfolio balance for a user
 */
export async function getPortfolioBalance(userId: string) {
  return await getOrCreatePortfolioBalance(userId);
}

/**
 * Set initial cash for a user
 */
export async function setInitialCash(userId: string, initialCash: number): Promise<void> {
  if (initialCash < 0) {
    throw new Error('Initial cash cannot be negative');
  }
  
  const balance = await getOrCreatePortfolioBalance(userId);
  
  // If there are existing investments, we need to adjust
  const currentTotal = balance.cash + balance.invested;
  const newCash = initialCash - balance.invested;
  
  if (newCash < 0) {
    throw new Error(`Initial cash (${initialCash}) must be at least equal to current invested amount (${balance.invested.toFixed(2)})`);
  }
  
  await updatePortfolioBalance(userId, {
    initialCash,
    cash: newCash,
  });
}

