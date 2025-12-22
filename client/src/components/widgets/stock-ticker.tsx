import { useMemo } from "react"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { cn, formatCurrency, formatPercentage, getChangeColor } from "../../lib/utils"
import { useDashboardStore } from "../../stores/dashboard-store"
import { useDefaultStocks } from "../../hooks/api"

interface TickerItemProps {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  GOOGL: "Alphabet Inc.",
  MSFT: "Microsoft",
  TSLA: "Tesla Inc.",
  AMZN: "Amazon.com",
  NVDA: "NVIDIA Corp.",
  META: "Meta Platforms",
  NFLX: "Netflix",
  AMD: "AMD",
  INTC: "Intel",
}

function TickerItem({ symbol, name, price, change, changePercent }: TickerItemProps) {
  const isPositive = change >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center gap-4 px-4 py-2 min-w-[200px] border-r border-border/50">
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{symbol}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-foreground">{formatCurrency(price)}</span>
        <div className={cn("flex items-center gap-1 text-xs", getChangeColor(change))}>
          <Icon className="w-3 h-3" />
          <span>{formatPercentage(changePercent)}</span>
        </div>
      </div>
    </div>
  )
}

export function StockTicker() {
  const { stocks, watchlistStocks } = useDashboardStore()

  // Fetch default stocks from REST API
  const { data: apiStocks, isLoading } = useDefaultStocks()

  const tickerData = useMemo(() => {
    // First try WebSocket data from store
    const wsData = watchlistStocks
      .map((symbol) => stocks[symbol])
      .filter(Boolean)
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name || STOCK_NAMES[stock.symbol] || stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
      }))

    if (wsData.length > 0) return wsData

    // Fallback to API data
    if (apiStocks && apiStocks.length > 0) {
      return apiStocks.map(stock => ({
        symbol: stock.symbol,
        name: STOCK_NAMES[stock.symbol] || stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
      }))
    }

    return []
  }, [stocks, watchlistStocks, apiStocks])

  if (isLoading && tickerData.length === 0) {
    return (
      <div className="w-full bg-card border-b border-border h-12 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading stocks from Polygon.io...</span>
      </div>
    )
  }

  if (tickerData.length === 0) {
    return (
      <div className="w-full bg-card border-b border-border h-12 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No stock data available</span>
      </div>
    )
  }

  return (
    <div className="w-full bg-card border-b border-border overflow-hidden">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {/* Duplicate content for seamless scrolling */}
          {[...tickerData, ...tickerData].map((stock, index) => (
            <TickerItem
              key={`${stock.symbol}-${index}`}
              symbol={stock.symbol}
              name={stock.name}
              price={stock.price}
              change={stock.change}
              changePercent={stock.changePercent}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
