// Stock Types
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

// Crypto Types
export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  image?: string;
  timestamp: number;
}

// Currency Types
export interface CurrencyRate {
  base: string;
  target: string;
  rate: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
}

// News Types
export interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: number; // Unix timestamp in milliseconds
  relatedTickers?: string[];
  url: string;
  image?: string; // Optional image URL (from Open Graph or placeholder)
}

// WebSocket Types
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'stock-update'
  | 'crypto-update'
  | 'currency-update'
  | 'error'
  | 'connected'
  | 'heartbeat';

export interface WSSubscription {
  channel: 'stocks' | 'crypto' | 'currencies';
  symbols: string[];
}

export interface WSClient {
  id: string;
  socket: WebSocket;
  subscriptions: WSSubscription[];
  lastHeartbeat: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  watchlistStocks: string[];
  watchlistCrypto: string[];
  favoriteCurrencies: string[];
  theme: 'dark' | 'light';
  currency: string;
}

