import { useDashboardStore } from "../stores/dashboard-store"
import { useSubscription } from "./use-websocket"

// Hook to get and subscribe to stock data
export function useStockData(symbols: string[]) {
  const { stocks } = useDashboardStore()

  // Subscribe to WebSocket updates
  useSubscription({ channel: "stocks", symbols })

  // Return stock data for the requested symbols
  const data = symbols.map((s) => stocks[s]).filter(Boolean)

  return {
    data,
    isLoading: data.length === 0,
  }
}

// Hook to get and subscribe to crypto data
export function useCryptoData(symbols: string[]) {
  const { cryptos } = useDashboardStore()

  // Subscribe to WebSocket updates
  useSubscription({ channel: "crypto", symbols })

  // Return crypto data for the requested symbols
  const data = symbols.map((s) => cryptos[s]).filter(Boolean)

  return {
    data,
    isLoading: data.length === 0,
  }
}

// Hook to get and subscribe to currency data
export function useCurrencyData(pairs: string[]) {
  const { currencies } = useDashboardStore()

  // Subscribe to WebSocket updates
  useSubscription({ channel: "currencies", symbols: pairs })

  // Return currency data for the requested pairs
  const data = pairs.map((pair) => currencies[pair]).filter(Boolean)

  return {
    data,
    isLoading: data.length === 0,
  }
}

// Hook to get watchlist stocks with data
export function useWatchlistStocks() {
  const { stocks, watchlistStocks, addToWatchlist, removeFromWatchlist } = useDashboardStore()

  useSubscription({ channel: "stocks", symbols: watchlistStocks })

  const data = watchlistStocks.map((sym) => {
    const stockData = stocks[sym]
    return stockData ? { ...stockData, symbol: sym } : { symbol: sym }
  })

  return {
    data,
    symbols: watchlistStocks,
    add: (sym: string) => addToWatchlist("stock", sym),
    remove: (sym: string) => removeFromWatchlist("stock", sym),
  }
}

// Hook to get watchlist crypto with data
export function useWatchlistCrypto() {
  const { cryptos, watchlistCrypto, addToWatchlist, removeFromWatchlist } = useDashboardStore()

  useSubscription({ channel: "crypto", symbols: watchlistCrypto })

  const data = watchlistCrypto.map((sym) => {
    const cryptoData = cryptos[sym]
    return cryptoData ? { ...cryptoData, symbol: sym } : { symbol: sym }
  })

  return {
    data,
    symbols: watchlistCrypto,
    add: (sym: string) => addToWatchlist("crypto", sym),
    remove: (sym: string) => removeFromWatchlist("crypto", sym),
  }
}
