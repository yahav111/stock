import axios from 'axios';
import { env } from '../../config/env.js';
import type { Cryptocurrency } from '../../types/index.js';

const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com';

// In-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getCryptoPrice(symbol: string): Promise<Cryptocurrency | null> {
  const cacheKey = `crypto:${symbol}`;
  const cached = getCached<Cryptocurrency>(cacheKey);
  if (cached) return cached;

  if (!env.CRYPTOCOMPARE_API_KEY) {
    console.warn('CryptoCompare API key not configured, returning mock data');
    return getMockCrypto(symbol);
  }

  try {
    const response = await axios.get(`${CRYPTOCOMPARE_BASE_URL}/data/pricemultifull`, {
      params: {
        fsyms: symbol,
        tsyms: 'USD',
        api_key: env.CRYPTOCOMPARE_API_KEY,
      },
    });

    const data = response.data.RAW?.[symbol]?.USD;
    if (!data) return null;

    const crypto: Cryptocurrency = {
      id: symbol.toLowerCase(),
      symbol,
      name: getCryptoName(symbol),
      price: data.PRICE,
      change24h: data.CHANGE24HOUR,
      changePercent24h: data.CHANGEPCT24HOUR,
      marketCap: data.MKTCAP,
      volume24h: data.VOLUME24HOUR,
      high24h: data.HIGH24HOUR,
      low24h: data.LOW24HOUR,
      image: `https://www.cryptocompare.com${data.IMAGEURL}`,
      timestamp: Date.now(),
    };

    setCache(cacheKey, crypto);
    return crypto;
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error);
    return getMockCrypto(symbol);
  }
}

export async function getMultipleCryptoPrices(symbols: string[]): Promise<Cryptocurrency[]> {
  const cacheKey = `cryptos:${symbols.join(',')}`;
  const cached = getCached<Cryptocurrency[]>(cacheKey);
  if (cached) return cached;

  if (!env.CRYPTOCOMPARE_API_KEY) {
    return symbols.map(getMockCrypto);
  }

  try {
    const response = await axios.get(`${CRYPTOCOMPARE_BASE_URL}/data/pricemultifull`, {
      params: {
        fsyms: symbols.join(','),
        tsyms: 'USD',
        api_key: env.CRYPTOCOMPARE_API_KEY,
      },
    });

    const cryptos: Cryptocurrency[] = [];
    for (const symbol of symbols) {
      const data = response.data.RAW?.[symbol]?.USD;
      if (data) {
        cryptos.push({
          id: symbol.toLowerCase(),
          symbol,
          name: getCryptoName(symbol),
          price: data.PRICE,
          change24h: data.CHANGE24HOUR,
          changePercent24h: data.CHANGEPCT24HOUR,
          marketCap: data.MKTCAP,
          volume24h: data.VOLUME24HOUR,
          high24h: data.HIGH24HOUR,
          low24h: data.LOW24HOUR,
          image: `https://www.cryptocompare.com${data.IMAGEURL}`,
          timestamp: Date.now(),
        });
      }
    }

    setCache(cacheKey, cryptos);
    return cryptos;
  } catch (error) {
    console.error('Error fetching multiple crypto prices:', error);
    return symbols.map(getMockCrypto);
  }
}

// Helper to get crypto name
function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'BNB',
    SOL: 'Solana',
    XRP: 'XRP',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
    AVAX: 'Avalanche',
    DOT: 'Polkadot',
    MATIC: 'Polygon',
    LINK: 'Chainlink',
    UNI: 'Uniswap',
    ATOM: 'Cosmos',
    LTC: 'Litecoin',
    BCH: 'Bitcoin Cash',
  };
  return names[symbol] || symbol;
}

// Search result type
export interface CryptoSearchResult {
  symbol: string;
  name: string;
}

// Search for cryptocurrencies using CryptoCompare coin list
export async function searchCrypto(query: string, limit: number = 10): Promise<CryptoSearchResult[]> {
  const cacheKey = `crypto-search:${query.toLowerCase()}`;
  const cached = getCached<CryptoSearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // CryptoCompare doesn't have a search endpoint, so we use the coin list
    // and filter by name/symbol
    const response = await axios.get(`${CRYPTOCOMPARE_BASE_URL}/data/all/coinlist`, {
      params: {
        api_key: env.CRYPTOCOMPARE_API_KEY,
      },
      timeout: 10000,
    });

    const coins = response.data.Data || {};
    const queryLower = query.toLowerCase();
    const results: CryptoSearchResult[] = [];

    // Filter coins by symbol or name
    for (const [symbol, coinData] of Object.entries(coins)) {
      const coin = coinData as any;
      const coinName = (coin.CoinName || '').toLowerCase();
      const coinSymbol = symbol.toLowerCase();

      if (
        coinSymbol.includes(queryLower) ||
        coinName.includes(queryLower)
      ) {
        results.push({
          symbol: symbol.toUpperCase(),
          name: coin.CoinName || symbol,
        });

        if (results.length >= limit) break;
      }
    }

    // Sort: exact symbol matches first, then name matches
    results.sort((a, b) => {
      const aSymbolMatch = a.symbol.toLowerCase() === queryLower;
      const bSymbolMatch = b.symbol.toLowerCase() === queryLower;
      if (aSymbolMatch && !bSymbolMatch) return -1;
      if (!aSymbolMatch && bSymbolMatch) return 1;
      return a.name.localeCompare(b.name);
    });

    setCache(cacheKey, results);
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error);
    // Return mock results on error
    return getMockSearchResults(query, limit);
  }
}

function getMockSearchResults(query: string, limit: number): CryptoSearchResult[] {
  const mockCryptos: CryptoSearchResult[] = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'XRP', name: 'XRP' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'DOGE', name: 'Dogecoin' },
    { symbol: 'AVAX', name: 'Avalanche' },
    { symbol: 'DOT', name: 'Polkadot' },
    { symbol: 'MATIC', name: 'Polygon' },
    { symbol: 'LINK', name: 'Chainlink' },
    { symbol: 'UNI', name: 'Uniswap' },
    { symbol: 'ATOM', name: 'Cosmos' },
    { symbol: 'LTC', name: 'Litecoin' },
    { symbol: 'BCH', name: 'Bitcoin Cash' },
  ];

  const queryLower = query.toLowerCase();
  const filtered = mockCryptos.filter(
    (crypto) =>
      crypto.symbol.toLowerCase().includes(queryLower) ||
      crypto.name.toLowerCase().includes(queryLower)
  );

  return filtered.slice(0, limit);
}

// Mock data for development
function getMockCrypto(symbol: string): Cryptocurrency {
  const mockPrices: Record<string, number> = {
    BTC: 43521.67,
    ETH: 2284.35,
    BNB: 312.45,
    SOL: 98.73,
    XRP: 0.6234,
    ADA: 0.5842,
    DOGE: 0.0923,
    AVAX: 35.67,
    DOT: 7.23,
    MATIC: 0.89,
  };

  const price = mockPrices[symbol] || 10 + Math.random() * 100;
  const change = (Math.random() - 0.5) * price * 0.1;

  return {
    id: symbol.toLowerCase(),
    symbol,
    name: getCryptoName(symbol),
    price,
    change24h: change,
    changePercent24h: (change / price) * 100,
    marketCap: Math.floor(Math.random() * 100000000000),
    volume24h: Math.floor(Math.random() * 1000000000),
    high24h: price * 1.05,
    low24h: price * 0.95,
    timestamp: Date.now(),
  };
}

