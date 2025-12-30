import { useState, useEffect, useRef, useMemo } from "react"
import { Star, X, TrendingUp, TrendingDown, Loader2, Search } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { cn, formatCurrency, formatPercentage, getChangeColor } from "../../lib/utils"
import { useDashboardStore } from "../../stores/dashboard-store"
import { usePreferences, useAddToStockWatchlist, useAddToCryptoWatchlist } from "../../hooks/api/use-preferences"
import { useStockSearch, useCryptoSearch } from "../../hooks/api"
import { useDebounce } from "../../hooks/use-debounce"

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

interface SearchResult {
  symbol: string
  name: string
  exchange?: string
}

export function Watchlist() {
  const [newSymbol, setNewSymbol] = useState("")
  const [activeTab, setActiveTab] = useState("stocks")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Debounce search query (500ms)
  const debouncedQuery = useDebounce(newSymbol, 500)
  
  // Load preferences from server on mount
  const { isLoading: isLoadingPrefs } = usePreferences()
  
  const {
    stocks,
    cryptos,
    watchlistStocks,
    watchlistCrypto,
  } = useDashboardStore()

  // API hooks for adding/removing - these save to database
  const { addStock, removeStock, isPending: isPendingStocks, error: stockError } = useAddToStockWatchlist()
  const { addCrypto, removeCrypto, isPending: isPendingCrypto, error: cryptoError } = useAddToCryptoWatchlist()

  const isPending = isPendingStocks || isPendingCrypto
  
  // Log errors if any
  useEffect(() => {
    if (stockError) {
      console.error('[WATCHLIST] Stock watchlist error:', stockError)
    }
    if (cryptoError) {
      console.error('[WATCHLIST] Crypto watchlist error:', cryptoError)
    }
  }, [stockError, cryptoError])

  // Search hooks with debounced query (requires at least 2 characters)
  const { data: stockSearchResults, isFetching: isFetchingStocks } = useStockSearch(
    { q: debouncedQuery, limit: 8 },
    debouncedQuery.length >= 2 && isSearchOpen && activeTab === "stocks"
  )

  const { data: cryptoSearchResults, isFetching: isFetchingCrypto } = useCryptoSearch(
    { q: debouncedQuery, limit: 8 },
    debouncedQuery.length >= 2 && isSearchOpen && activeTab === "crypto"
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectResult = async (result: SearchResult, type: "stock" | "crypto") => {
    const symbol = result.symbol.toUpperCase()
    
    console.log(`[WATCHLIST] handleSelectResult called:`, { symbol, type, result })
    
    try {
      if (type === "stock") {
        if (watchlistStocks.includes(symbol)) {
          console.log(`[WATCHLIST] ${symbol} already in stocks watchlist`)
          setNewSymbol("")
          setIsSearchOpen(false)
          return
        }
        console.log(`[WATCHLIST] Adding ${symbol} to stocks watchlist...`)
        addStock(symbol)
      } else {
        if (watchlistCrypto.includes(symbol)) {
          console.log(`[WATCHLIST] ${symbol} already in crypto watchlist`)
          setNewSymbol("")
          setIsSearchOpen(false)
          return
        }
        console.log(`[WATCHLIST] Adding ${symbol} to crypto watchlist...`)
        addCrypto(symbol)
      }
      
      setNewSymbol("")
      setIsSearchOpen(false)
    } catch (error) {
      console.error(`[WATCHLIST] Error adding ${symbol} to watchlist:`, error)
    }
  }

  const handleAddSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase()
    if (!symbol) return

    // Validate symbol format (basic check)
    if (symbol.length < 1 || symbol.length > 10) {
      console.warn("Invalid symbol format")
      return
    }

    if (activeTab === "stocks") {
      // Check if already in watchlist
      if (watchlistStocks.includes(symbol)) {
        console.log(`${symbol} is already in watchlist`)
        return
      }
      addStock(symbol)
      console.log(`Added ${symbol} to stocks watchlist`)
    } else {
      // Check if already in watchlist
      if (watchlistCrypto.includes(symbol)) {
        console.log(`${symbol} is already in watchlist`)
        return
      }
      addCrypto(symbol)
      console.log(`Added ${symbol} to crypto watchlist`)
    }
    setNewSymbol("")
    setIsSearchOpen(false)
  }

  const handleRemoveSymbol = (symbol: string, type: "stock" | "crypto") => {
    if (type === "stock") {
      removeStock(symbol)
      console.log(`Removed ${symbol} from stocks watchlist`)
    } else {
      removeCrypto(symbol)
      console.log(`Removed ${symbol} from crypto watchlist`)
    }
  }

  // Get current search results based on active tab
  const currentSearchResults: SearchResult[] = useMemo(() => {
    if (activeTab === "stocks" && stockSearchResults) {
      return stockSearchResults.map((r: any) => ({
        symbol: r.symbol,
        name: r.name,
        exchange: r.exchange,
      }))
    } else if (activeTab === "crypto" && cryptoSearchResults) {
      return cryptoSearchResults.map((r: any) => ({
        symbol: r.symbol,
        name: r.name,
      }))
    }
    return []
  }, [activeTab, stockSearchResults, cryptoSearchResults])

  // Show loading state during debounce or fetch
  const isSearching = 
    (newSymbol.length >= 2 && newSymbol !== debouncedQuery) || 
    isFetchingStocks || 
    isFetchingCrypto

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

          {/* Search Input with Autocomplete */}
          <div ref={searchRef} className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={`Search ${activeTab === "stocks" ? "stocks" : "crypto"}...`}
                value={newSymbol}
                onChange={(e) => {
                  setNewSymbol(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isPending && newSymbol.trim()) {
                    handleAddSymbol()
                  }
                }}
                className="pl-10 pr-10"
                disabled={isPending || isLoadingPrefs}
                autoComplete="off"
              />
              {newSymbol && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent/50"
                  onClick={() => {
                    setNewSymbol("")
                    setIsSearchOpen(false)
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && debouncedQuery.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-xl max-h-[300px] overflow-hidden">
                <div className="overflow-y-auto max-h-[300px]">
                  {isSearching ? (
                    <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    </div>
                  ) : currentSearchResults.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                        <Search className="w-3.5 h-3.5" />
                        <span>Search Results</span>
                      </div>
                      {currentSearchResults.map((result) => (
                        <button
                          key={result.symbol}
                          onClick={() => handleSelectResult(result, activeTab as "stock" | "crypto")}
                          className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                                {result.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {result.name}
                              </div>
                            </div>
                            {result.exchange && (
                              <div className="text-xs text-muted-foreground shrink-0 px-2 py-1 rounded bg-muted/50">
                                {result.exchange}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        No results found
                      </div>
                      <div className="text-xs text-muted-foreground/70 font-mono">
                        "{debouncedQuery}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <TabsContent value="stocks" className="space-y-1 max-h-[300px] overflow-y-auto">
            {isLoadingPrefs ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : stocksData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No stocks in watchlist. Add symbols above to track them.
              </div>
            ) : (
              stocksData.map((stock) => (
                <WatchlistItem
                  key={stock.symbol}
                  {...stock}
                  onRemove={() => handleRemoveSymbol(stock.symbol, "stock")}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="crypto" className="space-y-1 max-h-[300px] overflow-y-auto">
            {isLoadingPrefs ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : cryptoData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No cryptocurrencies in watchlist. Add symbols above to track them.
              </div>
            ) : (
              cryptoData.map((crypto) => (
                <WatchlistItem
                  key={crypto.symbol}
                  {...crypto}
                  onRemove={() => handleRemoveSymbol(crypto.symbol, "crypto")}
                />
              ))
            )}
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
