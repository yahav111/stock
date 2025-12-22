import { pgTable, text, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  watchlistStocks: jsonb('watchlist_stocks').$type<string[]>().default([]),
  watchlistCrypto: jsonb('watchlist_crypto').$type<string[]>().default([]),
  favoriteCurrencies: jsonb('favorite_currencies').$type<string[]>().default([]),
  dashboardLayout: jsonb('dashboard_layout').$type<object[]>().default([]),
  theme: varchar('theme', { length: 10 }).default('dark'),
  defaultChart: varchar('default_chart', { length: 20 }).default('candlestick'),
  defaultTimeframe: varchar('default_timeframe', { length: 10 }).default('1D'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Also export as 'preferences' for backward compatibility
export const preferences = userPreferences;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
