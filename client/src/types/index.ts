// Stock Types
export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: number
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: number
}

export interface StockDetails {
  symbol: string
  name: string
  description?: string
  sector?: string
  industry?: string
  marketCap?: number
  employees?: number
  website?: string
  exchange?: string
}

export interface HistoricalBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Crypto Types
export interface Cryptocurrency {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  totalSupply: number
  high24h: number
  low24h: number
  image: string
  timestamp: number
}

export interface CryptoQuote {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  timestamp: number
}

// Currency Types
export interface CurrencyRate {
  base: string
  target: string
  rate: number
  change: number
  changePercent: number
  timestamp: number
}

export interface CurrencyPair {
  from: string
  to: string
  rate: number
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  userId: string
  watchlistStocks: string[]
  watchlistCrypto: string[]
  favoriteCurrencies: string[]
  dashboardLayout: DashboardWidget[]
  theme: "dark" | "light"
  currency: string
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: Record<string, unknown>
}

export type WidgetType =
  | "stock-ticker"
  | "crypto-ticker"
  | "currency-rates"
  | "stock-chart"
  | "crypto-chart"
  | "watchlist"
  | "portfolio"
  | "news"
  | "market-overview"

// WebSocket Types
export interface WSMessage {
  type: WSMessageType
  payload: unknown
  timestamp: number
}

export type WSMessageType =
  | "subscribe"
  | "unsubscribe"
  | "stock-update"
  | "crypto-update"
  | "currency-update"
  | "error"
  | "connected"
  | "heartbeat"

export interface WSSubscription {
  channel: "stocks" | "crypto" | "currencies"
  symbols: string[]
}

// Chart Types
export interface ChartData {
  time: number
  value: number
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface ChartOptions {
  type: "line" | "area" | "candlestick" | "bar"
  timeframe: Timeframe
  indicators?: Indicator[]
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M"

export interface Indicator {
  type: "sma" | "ema" | "rsi" | "macd" | "bollinger"
  period: number
  color?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  name: string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
}

// Upload Types
export interface FileUpload {
  id: string
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: Date
}

