import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Header } from "../components/layout/header"
import { Sidebar } from "../components/layout/sidebar"
import { StockTicker } from "../components/widgets/stock-ticker"
import { CryptoTicker } from "../components/widgets/crypto-ticker"
import { Watchlist } from "../components/widgets/watchlist"
import { CurrencyConverter } from "../components/widgets/currency-converter"
import { MarketNewsCarousel } from "../components/widgets/market-news-carousel"
import { TradingChart } from "../components/charts/trading-chart"
import { Portfolio } from "../components/widgets/portfolio"
import { UpcomingEventsPreview } from "../components/widgets/upcoming-events-preview"
import { useWebSocket } from "../hooks/use-websocket"
import { useDashboardStore } from "../stores/dashboard-store"
import { usePreferences } from "../hooks/api/use-preferences"

export function DashboardPage() {
  const { subscribeToStocks, subscribeToCrypto, isConnected } = useWebSocket()
  const { watchlistStocks, watchlistCrypto } = useDashboardStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // Load user preferences (including watchlist) from server on mount
  usePreferences()

  // Get symbol from URL or default to AAPL
  const symbol = searchParams.get("symbol")?.toUpperCase() || "AAPL"
  const timeframe = searchParams.get("range") || "1D"

  // Subscribe to watchlist symbols on mount and when watchlist changes
  useEffect(() => {
    if (isConnected) {
      subscribeToStocks(watchlistStocks)
      subscribeToCrypto(watchlistCrypto)
    }
  }, [isConnected, watchlistStocks, watchlistCrypto, subscribeToStocks, subscribeToCrypto])

  // Handle symbol change - update URL
  const handleSymbolChange = (newSymbol: string) => {
    setSearchParams({ symbol: newSymbol, range: timeframe })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header />

      {/* Real-time Stock & Crypto Tickers */}
      <StockTicker />
      <CryptoTicker />

      {/* Main content */}
      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Interactive Stock Chart with Search */}
            <div className="lg:col-span-3">
              <TradingChart 
                initialSymbol={symbol}
                className="h-[500px]" 
                showSearch={true}
                onSymbolChange={handleSymbolChange}
              />
            </div>

            {/* Currency Converter (via Open Exchange Rates API) */}
            <div className="lg:col-span-1">
              <CurrencyConverter />
            </div>

            {/* Portfolio - User Stock Holdings */}
            <div className="lg:col-span-4">
              <Portfolio />
            </div>

            {/* Watchlist - Stocks & Crypto */}
            <div className="lg:col-span-4">
              <Watchlist />
            </div>

            {/* Upcoming Events Preview */}
            <div className="lg:col-span-4">
              <UpcomingEventsPreview />
            </div>

            {/* Market News Carousel */}
            <div className="lg:col-span-4">
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <MarketNewsCarousel category="general" itemsPerPage={5} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
