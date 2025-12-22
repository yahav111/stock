// Default stocks to track
export const DEFAULT_STOCKS = [
  'AAPL',  // Apple
  'GOOGL', // Alphabet
  'MSFT',  // Microsoft
  'TSLA',  // Tesla
  'AMZN',  // Amazon
  'NVDA',  // NVIDIA
  'META',  // Meta
  'NFLX',  // Netflix
  'AMD',   // AMD
  'INTC',  // Intel
];

// Default cryptocurrencies to track
export const DEFAULT_CRYPTOS = [
  'BTC',  // Bitcoin
  'ETH',  // Ethereum
  'BNB',  // Binance Coin
  'SOL',  // Solana
  'XRP',  // Ripple
  'ADA',  // Cardano
  'DOGE', // Dogecoin
  'AVAX', // Avalanche
  'DOT',  // Polkadot
  'MATIC', // Polygon
];

// Default currencies to track
export const DEFAULT_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'ILS', // Israeli Shekel
  'JPY', // Japanese Yen
  'CHF', // Swiss Franc
  'CAD', // Canadian Dollar
  'AUD', // Australian Dollar
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
];

// API Rate Limits
export const RATE_LIMITS = {
  POLYGON: {
    requestsPerMinute: 5,
    requestsPerDay: 250, // Free tier
  },
  CRYPTOCOMPARE: {
    requestsPerSecond: 50,
    requestsPerDay: 100000,
  },
  OPENEXCHANGERATES: {
    requestsPerMonth: 1000, // Free tier
  },
};

// WebSocket settings
export const WS_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  reconnectDelay: 5000, // 5 seconds
  maxReconnectAttempts: 5,
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  stockQuote: 60, // 1 minute
  cryptoPrice: 30, // 30 seconds
  currencyRate: 3600, // 1 hour
  marketOverview: 300, // 5 minutes
};

