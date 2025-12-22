import { useMemo } from "react"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { cn, formatCurrency, formatPercentage, getChangeColor } from "../../lib/utils"
import { useDashboardStore } from "../../stores/dashboard-store"
import { useDefaultCryptos } from "../../hooks/api"

interface CryptoItemProps {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  image?: string
}

const CRYPTO_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "BNB",
  SOL: "Solana",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
  DOT: "Polkadot",
  MATIC: "Polygon",
}

function CryptoItem({ symbol, name, price, change24h, changePercent24h, image }: CryptoItemProps) {
  const isPositive = change24h >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center gap-4 px-4 py-2 min-w-[220px] border-r border-border/50">
      {image ? (
        <img src={image} alt={symbol} className="w-6 h-6 rounded-full" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
          {symbol.charAt(0)}
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{symbol}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{name}</span>
      </div>
      <div className="flex flex-col items-end ml-auto">
        <span className="font-mono text-foreground">{formatCurrency(price)}</span>
        <div className={cn("flex items-center gap-1 text-xs", getChangeColor(change24h))}>
          <Icon className="w-3 h-3" />
          <span>{formatPercentage(changePercent24h)}</span>
        </div>
      </div>
    </div>
  )
}

export function CryptoTicker() {
  const { cryptos, watchlistCrypto } = useDashboardStore()

  // Fetch default cryptos from REST API
  const { data: apiCryptos, isLoading } = useDefaultCryptos()

  const tickerData = useMemo(() => {
    // First try WebSocket data from store
    const wsData = watchlistCrypto
      .map((symbol) => cryptos[symbol])
      .filter(Boolean)
      .map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name || CRYPTO_NAMES[crypto.symbol] || crypto.symbol,
        price: crypto.price,
        change24h: crypto.change24h,
        changePercent24h: crypto.changePercent24h,
        image: crypto.image,
      }))

    if (wsData.length > 0) return wsData

    // Fallback to API data
    if (apiCryptos && apiCryptos.length > 0) {
      return apiCryptos.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name || CRYPTO_NAMES[crypto.symbol] || crypto.symbol,
        price: crypto.price,
        change24h: crypto.change24h,
        changePercent24h: crypto.changePercent24h,
        image: crypto.image,
      }))
    }

    return []
  }, [cryptos, watchlistCrypto, apiCryptos])

  if (isLoading && tickerData.length === 0) {
    return (
      <div className="w-full bg-secondary/50 border-b border-border h-12 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading crypto from CryptoCompare...</span>
      </div>
    )
  }

  if (tickerData.length === 0) {
    return (
      <div className="w-full bg-secondary/50 border-b border-border h-12 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No crypto data available</span>
      </div>
    )
  }

  return (
    <div className="w-full bg-secondary/50 border-b border-border overflow-hidden">
      <div className="ticker-wrapper">
        <div className="ticker-content" style={{ animationDirection: "reverse" }}>
          {/* Duplicate content for seamless scrolling */}
          {[...tickerData, ...tickerData].map((crypto, index) => (
            <CryptoItem
              key={`${crypto.symbol}-${index}`}
              symbol={crypto.symbol}
              name={crypto.name}
              price={crypto.price}
              change24h={crypto.change24h}
              changePercent24h={crypto.changePercent24h}
              image={crypto.image}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
