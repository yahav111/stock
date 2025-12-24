import { pgTable, text, timestamp, numeric, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const portfolio = pgTable('portfolio', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  shares: numeric('shares', { precision: 15, scale: 4 }).notNull(),
  averagePrice: numeric('average_price', { precision: 15, scale: 4 }).notNull(),
  currentPrice: numeric('current_price', { precision: 15, scale: 4 }),
  gainLoss: numeric('gain_loss', { precision: 15, scale: 4 }),
  gainLossPercent: numeric('gain_loss_percent', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.symbol] }),
}));

export type Portfolio = typeof portfolio.$inferSelect;
export type NewPortfolio = typeof portfolio.$inferInsert;

