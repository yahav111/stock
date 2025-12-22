import { useState, useEffect, useRef, useMemo } from "react"
import { Search, TrendingUp, Clock, X, Coins } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useStockSearch } from "../../hooks/api"

interface StockSearchProps {
  value: string
  onChange: (symbol: string) => void
  onSelect?: (symbol: string) => void
  placeholder?: string
  className?: string
  showRecentlyViewed?: boolean
}

interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

// Supported cryptocurrencies (must match backend list)
const SUPPORTED_CRYPTOS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC',
  'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'ALGO', 'ETC', 'XLM', 'FIL', 'AAVE',
  'SAND', 'MANA', 'AXS', 'THETA', 'EOS',
] as const;

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
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
  ALGO: 'Algorand',
  ETC: 'Ethereum Classic',
  XLM: 'Stellar',
  FIL: 'Filecoin',
  AAVE: 'Aave',
  SAND: 'The Sandbox',
  MANA: 'Decentraland',
  AXS: 'Axie Infinity',
  THETA: 'Theta Network',
  EOS: 'EOS',
};

export function StockSearch({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Search stocks... (e.g. AAPL, TSLA)",
  className,
  showRecentlyViewed = true 
}: StockSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const searchRef = useRef<HTMLDivElement>(null)

  // Check if query matches a supported crypto
  const isCryptoMatch = useMemo(() => {
    const upperQuery = query.toUpperCase().trim();
    return SUPPORTED_CRYPTOS.includes(upperQuery as any);
  }, [query]);

  // Fetch stock search results (only if not exact crypto match)
  const { data: searchResults, isLoading } = useStockSearch(
    { q: query, limit: 8 },
    query.length >= 1 && isOpen && !isCryptoMatch
  )

  // Get recently viewed from localStorage
  const recentlyViewed = showRecentlyViewed ? getRecentlyViewed() : []

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    setQuery(upperSymbol)
    onChange(upperSymbol)
    if (onSelect) onSelect(upperSymbol)
    addToRecentlyViewed(upperSymbol)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value.toUpperCase()
    setQuery(newQuery)
    onChange(newQuery)
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery("")
    onChange("")
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-9 text-sm font-mono"
          autoComplete="off"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent/50"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Dropdown - TradingView style */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-xl max-h-[420px] overflow-hidden">
          <div className="overflow-y-auto max-h-[420px]">
            {/* Recently Viewed */}
            {!query && recentlyViewed.length > 0 && (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recently Viewed</span>
                </div>
                {recentlyViewed.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleSearch(symbol)}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent/50 active:bg-accent transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-mono font-semibold text-sm">{symbol}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Crypto Match - Show directly */}
            {query && isCryptoMatch && (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Cryptocurrency</span>
                </div>
                <button
                  onClick={() => handleSearch(query.toUpperCase())}
                  className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                        {query.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {CRYPTO_NAMES[query.toUpperCase()] || 'Cryptocurrency'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 px-2 py-1 rounded bg-primary/10 text-primary">
                      CRYPTO
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Search Results - Stocks */}
            {query && !isCryptoMatch && (
              <div className="py-1">
                {isLoading && (
                  <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </div>
                  </div>
                )}

                {!isLoading && searchResults && searchResults.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Results</span>
                    </div>
                    {searchResults.map((result: SearchResult) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSearch(result.symbol)}
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
                          <div className="text-xs text-muted-foreground shrink-0 px-2 py-1 rounded bg-muted/50">
                            {result.exchange}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {!isLoading && searchResults && searchResults.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      No results found
                    </div>
                    <div className="text-xs text-muted-foreground/70 font-mono">
                      "{query}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Popular Stocks (when empty) */}
            {!query && recentlyViewed.length === 0 && (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Popular Stocks</span>
                </div>
                {POPULAR_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSearch(stock.symbol)}
                    className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                          {stock.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for localStorage
const RECENTLY_VIEWED_KEY = "recentlyViewedStocks"
const MAX_RECENT = 8

function getRecentlyViewed(): string[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addToRecentlyViewed(symbol: string) {
  try {
    let recent = getRecentlyViewed()
    // Remove if exists
    recent = recent.filter(s => s !== symbol)
    // Add to beginning
    recent.unshift(symbol)
    // Limit size
    recent = recent.slice(0, MAX_RECENT)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent))
  } catch (error) {
    console.error("Failed to save to recently viewed:", error)
  }
}

// Popular stocks for empty state
const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NFLX", name: "Netflix, Inc." },
]

