import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Stock, Cryptocurrency, CurrencyRate, DashboardWidget, WidgetType } from "../types"

interface DashboardState {
  // Real-time data
  stocks: Record<string, Stock>
  cryptos: Record<string, Cryptocurrency>
  currencies: Record<string, CurrencyRate>

  // Watchlists
  watchlistStocks: string[]
  watchlistCrypto: string[]
  favoriteCurrencies: string[]

  // Dashboard layout
  widgets: DashboardWidget[]
  activeWidget: string | null

  // Connection status
  isConnected: boolean
  lastUpdate: number | null

  // Actions
  updateStock: (symbol: string, data: Partial<Stock>) => void
  updateCrypto: (symbol: string, data: Partial<Cryptocurrency>) => void
  updateCurrency: (pair: string, data: Partial<CurrencyRate>) => void

  setStocks: (stocks: Stock[]) => void
  setCryptos: (cryptos: Cryptocurrency[]) => void
  setCurrencies: (currencies: CurrencyRate[]) => void

  addToWatchlist: (type: "stock" | "crypto", symbol: string) => void
  removeFromWatchlist: (type: "stock" | "crypto", symbol: string) => void
  toggleFavoriteCurrency: (currency: string) => void
  setWatchlistStocks: (stocks: string[]) => void
  setWatchlistCrypto: (crypto: string[]) => void
  setFavoriteCurrencies: (currencies: string[]) => void

  addWidget: (type: WidgetType, config?: Record<string, unknown>) => void
  removeWidget: (id: string) => void
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void
  setActiveWidget: (id: string | null) => void

  setConnectionStatus: (connected: boolean) => void
}

const generateWidgetId = () => `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Initial state
      stocks: {},
      cryptos: {},
      currencies: {},
      watchlistStocks: ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META"],
      watchlistCrypto: ["BTC", "ETH", "SOL", "BNB", "XRP"],
      favoriteCurrencies: ["USD", "EUR", "GBP", "ILS", "JPY"],
      widgets: [
        { id: "default-1", type: "stock-ticker", position: { x: 0, y: 0 }, size: { width: 4, height: 1 } },
        { id: "default-2", type: "crypto-ticker", position: { x: 0, y: 1 }, size: { width: 4, height: 1 } },
        { id: "default-3", type: "watchlist", position: { x: 0, y: 2 }, size: { width: 2, height: 2 } },
        { id: "default-4", type: "stock-chart", position: { x: 2, y: 2 }, size: { width: 2, height: 2 } },
      ],
      activeWidget: null,
      isConnected: false,
      lastUpdate: null,

      // Stock actions
      updateStock: (symbol, data) =>
        set((state) => ({
          stocks: {
            ...state.stocks,
            [symbol]: {
              ...state.stocks[symbol],
              ...data,
              timestamp: Date.now(),
            } as Stock,
          },
          lastUpdate: Date.now(),
        })),

      setStocks: (stocks) =>
        set({
          stocks: stocks.reduce(
            (acc, stock) => ({
              ...acc,
              [stock.symbol]: stock,
            }),
            {}
          ),
          lastUpdate: Date.now(),
        }),

      // Crypto actions
      updateCrypto: (symbol, data) =>
        set((state) => ({
          cryptos: {
            ...state.cryptos,
            [symbol]: {
              ...state.cryptos[symbol],
              ...data,
              timestamp: Date.now(),
            } as Cryptocurrency,
          },
          lastUpdate: Date.now(),
        })),

      setCryptos: (cryptos) =>
        set({
          cryptos: cryptos.reduce(
            (acc, crypto) => ({
              ...acc,
              [crypto.symbol]: crypto,
            }),
            {}
          ),
          lastUpdate: Date.now(),
        }),

      // Currency actions
      updateCurrency: (pair, data) =>
        set((state) => ({
          currencies: {
            ...state.currencies,
            [pair]: {
              ...state.currencies[pair],
              ...data,
              timestamp: Date.now(),
            } as CurrencyRate,
          },
          lastUpdate: Date.now(),
        })),

      setCurrencies: (currencies) =>
        set({
          currencies: currencies.reduce(
            (acc, rate) => ({
              ...acc,
              [`${rate.base}/${rate.target}`]: rate,
            }),
            {}
          ),
          lastUpdate: Date.now(),
        }),

      // Watchlist actions
      addToWatchlist: (type, symbol) =>
        set((state) => ({
          watchlistStocks:
            type === "stock" && !state.watchlistStocks.includes(symbol)
              ? [...state.watchlistStocks, symbol]
              : state.watchlistStocks,
          watchlistCrypto:
            type === "crypto" && !state.watchlistCrypto.includes(symbol)
              ? [...state.watchlistCrypto, symbol]
              : state.watchlistCrypto,
        })),

      removeFromWatchlist: (type, symbol) =>
        set((state) => ({
          watchlistStocks:
            type === "stock" ? state.watchlistStocks.filter((s) => s !== symbol) : state.watchlistStocks,
          watchlistCrypto:
            type === "crypto" ? state.watchlistCrypto.filter((s) => s !== symbol) : state.watchlistCrypto,
        })),

      toggleFavoriteCurrency: (currency) =>
        set((state) => ({
          favoriteCurrencies: state.favoriteCurrencies.includes(currency)
            ? state.favoriteCurrencies.filter((c) => c !== currency)
            : [...state.favoriteCurrencies, currency],
        })),

      setWatchlistStocks: (stocks) => set({ watchlistStocks: stocks }),
      setWatchlistCrypto: (crypto) => set({ watchlistCrypto: crypto }),
      setFavoriteCurrencies: (currencies) => set({ favoriteCurrencies: currencies }),

      // Widget actions
      addWidget: (type, config) =>
        set((state) => ({
          widgets: [
            ...state.widgets,
            {
              id: generateWidgetId(),
              type,
              position: { x: 0, y: state.widgets.length },
              size: { width: 2, height: 2 },
              config,
            },
          ],
        })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      updateWidgetPosition: (id, position) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, position } : w)),
        })),

      setActiveWidget: (activeWidget) => set({ activeWidget }),

      setConnectionStatus: (isConnected) => set({ isConnected }),
    }),
    {
      name: "dashboard-storage",
      partialize: (state) => ({
        watchlistStocks: state.watchlistStocks,
        watchlistCrypto: state.watchlistCrypto,
        favoriteCurrencies: state.favoriteCurrencies,
        widgets: state.widgets,
      }),
    }
  )
)

