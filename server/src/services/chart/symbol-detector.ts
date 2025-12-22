/**
 * Symbol Detector
 * Determines if a symbol is a cryptocurrency or stock
 * Frontend doesn't need to know - backend decides
 */

// Static list of supported cryptocurrencies
// CryptoCompare API supports many more, but we limit to popular ones for now
const SUPPORTED_CRYPTOS = [
  // Top 10 (original)
  'BTC',   // Bitcoin
  'ETH',   // Ethereum
  'SOL',   // Solana
  'BNB',   // BNB
  'XRP',   // XRP
  'ADA',   // Cardano
  'DOGE',  // Dogecoin
  'AVAX',  // Avalanche
  'DOT',   // Polkadot
  'MATIC', // Polygon
  // Additional popular cryptos
  'LINK',  // Chainlink
  'UNI',   // Uniswap
  'ATOM',  // Cosmos
  'LTC',   // Litecoin
  'BCH',   // Bitcoin Cash
  'ALGO',  // Algorand
  'ETC',   // Ethereum Classic
  'XLM',   // Stellar
  'FIL',   // Filecoin
  'AAVE',  // Aave
  'SAND',  // The Sandbox
  'MANA',  // Decentraland
  'AXS',   // Axie Infinity
  'THETA', // Theta Network
  'EOS',   // EOS
] as const;

export type SymbolType = 'crypto' | 'stock';

/**
 * Detects if symbol is crypto or stock
 * @param symbol - Stock or crypto symbol (e.g., 'AAPL', 'BTC')
 * @returns 'crypto' if in crypto list, 'stock' otherwise
 */
export function detectSymbolType(symbol: string): SymbolType {
  const upperSymbol = symbol.toUpperCase().trim();
  return SUPPORTED_CRYPTOS.includes(upperSymbol as any) ? 'crypto' : 'stock';
}

/**
 * Gets list of supported crypto symbols
 */
export function getSupportedCryptos(): readonly string[] {
  return SUPPORTED_CRYPTOS;
}

/**
 * Checks if symbol is a supported crypto
 */
export function isCrypto(symbol: string): boolean {
  return detectSymbolType(symbol) === 'crypto';
}

/**
 * Checks if symbol is a stock
 */
export function isStock(symbol: string): boolean {
  return detectSymbolType(symbol) === 'stock';
}

