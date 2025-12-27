import { pgTable, text, timestamp, numeric, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const portfolioBalance = pgTable('portfolio_balance', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  initialCash: numeric('initial_cash', { precision: 15, scale: 2 }).notNull().default('0'),
  cash: numeric('cash', { precision: 15, scale: 2 }).notNull().default('0'),
  invested: numeric('invested', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

export type PortfolioBalance = typeof portfolioBalance.$inferSelect;
export type NewPortfolioBalance = typeof portfolioBalance.$inferInsert;

