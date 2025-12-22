import { useState } from "react"
import { Star, Plus, X, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { cn, formatCurrency, formatPercentage, getChangeColor } from "../../lib/utils"
import { useDashboardStore } from "../../stores/dashboard-store"

interface WatchlistItemProps {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  onRemove: () => void
}

function WatchlistItem({ symbol, name, price, change, changePercent, onRemove }: WatchlistItemProps) {
  const isPositive = change >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group">
      <div className="flex items-center gap-3">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <div>
          <div className="font-semibold">{symbol}</div>
          <div className="text-xs text-muted-foreground">{name}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-mono">{formatCurrency(price)}</div>
          <div className={cn("flex items-center justify-end gap-1 text-xs", getChangeColor(change))}>
            <Icon className="w-3 h-3" />
            <span>{formatPercentage(changePercent)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function Watchlist() {
  const [newSymbol, setNewSymbol] = useState("")
  const [activeTab, setActiveTab] = useState("stocks")
  const {
    stocks,
    cryptos,
    watchlistStocks,
    watchlistCrypto,
    addToWatchlist,
    removeFromWatchlist,
  } = useDashboardStore()

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      addToWatchlist(activeTab as "stock" | "crypto", newSymbol.toUpperCase().trim())
      setNewSymbol("")
    }
  }

  // Placeholder data for demonstration
  const stocksData = watchlistStocks.map((symbol) => ({
    symbol,
    name: stocks[symbol]?.name || getStockName(symbol),
    price: stocks[symbol]?.price || getPlaceholderPrice(symbol),
    change: stocks[symbol]?.change || getPlaceholderChange(symbol),
    changePercent: stocks[symbol]?.changePercent || getPlaceholderChangePercent(symbol),
  }))

  const cryptoData = watchlistCrypto.map((symbol) => ({
    symbol,
    name: cryptos[symbol]?.name || getCryptoName(symbol),
    price: cryptos[symbol]?.price || getPlaceholderCryptoPrice(symbol),
    change: cryptos[symbol]?.change24h || getPlaceholderChange(symbol),
    changePercent: cryptos[symbol]?.changePercent24h || getPlaceholderChangePercent(symbol),
  }))

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Watchlist
          </CardTitle>
          <Badge variant="secondary">{watchlistStocks.length + watchlistCrypto.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="stocks" className="flex-1">Stocks</TabsTrigger>
            <TabsTrigger value="crypto" className="flex-1">Crypto</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder={`Add ${activeTab === "stocks" ? "stock" : "crypto"} symbol...`}
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleAddSymbol}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <TabsContent value="stocks" className="space-y-1 max-h-[300px] overflow-y-auto">
            {stocksData.map((stock) => (
              <WatchlistItem
                key={stock.symbol}
                {...stock}
                onRemove={() => removeFromWatchlist("stock", stock.symbol)}
              />
            ))}
          </TabsContent>

          <TabsContent value="crypto" className="space-y-1 max-h-[300px] overflow-y-auto">
            {cryptoData.map((crypto) => (
              <WatchlistItem
                key={crypto.symbol}
                {...crypto}
                onRemove={() => removeFromWatchlist("crypto", crypto.symbol)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper functions for placeholder data
function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    AAPL: "Apple Inc.",
    GOOGL: "Alphabet Inc.",
    MSFT: "Microsoft Corp.",
    TSLA: "Tesla Inc.",
    AMZN: "Amazon.com",
    NVDA: "NVIDIA Corp.",
    META: "Meta Platforms",
  }
  return names[symbol] || symbol
}

function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "BNB",
    SOL: "Solana",
    XRP: "XRP",
    ADA: "Cardano",
    DOGE: "Dogecoin",
  }
  return names[symbol] || symbol
}

function getPlaceholderPrice(symbol: string): number {
  const prices: Record<string, number> = {
    AAPL: 178.52,
    GOOGL: 141.80,
    MSFT: 374.58,
    TSLA: 248.48,
    AMZN: 178.25,
    NVDA: 467.32,
    META: 353.96,
  }
  return prices[symbol] || 100 + Math.random() * 200
}

function getPlaceholderCryptoPrice(symbol: string): number {
  const prices: Record<string, number> = {
    BTC: 43521.67,
    ETH: 2284.35,
    BNB: 312.45,
    SOL: 98.73,
    XRP: 0.6234,
    ADA: 0.5842,
    DOGE: 0.0923,
  }
  return prices[symbol] || 10 + Math.random() * 100
}

function getPlaceholderChange(symbol: string): number {
  const seed = symbol.charCodeAt(0)
  return (Math.sin(seed) * 10)
}

function getPlaceholderChangePercent(symbol: string): number {
  const seed = symbol.charCodeAt(0)
  return (Math.sin(seed) * 5)
}

