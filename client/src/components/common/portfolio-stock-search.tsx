import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Search, TrendingUp, Loader2 } from "lucide-react"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import { useStockSearch } from "../../hooks/api"
import { useDebounce } from "../../hooks/use-debounce"

interface PortfolioStockSearchProps {
  value: string
  onChange: (symbol: string) => void
  onSelect: (symbol: string) => void
  isValid: boolean
  onValidChange: (isValid: boolean) => void
  placeholder?: string
  className?: string
}

interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

// Top 20 most popular stocks (local list)
const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NFLX", name: "Netflix, Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc." },
  { symbol: "INTC", name: "Intel Corporation" },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "MA", name: "Mastercard Incorporated" },
  { symbol: "DIS", name: "The Walt Disney Company" },
  { symbol: "PYPL", name: "PayPal Holdings, Inc." },
  { symbol: "CRM", name: "Salesforce, Inc." },
  { symbol: "ORCL", name: "Oracle Corporation" },
  { symbol: "IBM", name: "International Business Machines Corporation" },
  { symbol: "CSCO", name: "Cisco Systems, Inc." },
  { symbol: "PEP", name: "PepsiCo, Inc." },
] as const

export function PortfolioStockSearch({ 
  value, 
  onChange, 
  onSelect,
  isValid,
  onValidChange,
  placeholder = "Search stocks... (e.g. AAPL, TSLA)",
  className,
}: PortfolioStockSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(value || null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounce query for API calls (500ms)
  const debouncedQuery = useDebounce(query, 500)

  // Check if query matches a popular stock locally
  const localMatch = useMemo(() => {
    if (!query) return null
    const upperQuery = query.toUpperCase().trim()
    return POPULAR_STOCKS.find(stock => 
      stock.symbol === upperQuery || 
      stock.name.toUpperCase().includes(upperQuery)
    )
  }, [query])

  // Filter popular stocks by query
  const filteredPopularStocks = useMemo(() => {
    if (!query) return POPULAR_STOCKS
    const upperQuery = query.toUpperCase().trim()
    return POPULAR_STOCKS.filter(stock => 
      stock.symbol.includes(upperQuery) || 
      stock.name.toUpperCase().includes(upperQuery)
    )
  }, [query])

  // Fetch from API only if query is more than 2 characters and no local match
  const shouldFetchAPI = debouncedQuery.length >= 2 && !localMatch
  const { data: apiResults, isLoading, isFetching } = useStockSearch(
    { q: debouncedQuery, limit: 10 },
    shouldFetchAPI && isOpen
  )

  // Show loading state during debounce or fetch
  const isSearching = (query.length >= 2 && query !== debouncedQuery) || isFetching

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

  // Update validity when selection changes
  useEffect(() => {
    if (selectedSymbol && value === selectedSymbol) {
      onValidChange(true)
    } else if (value && value !== selectedSymbol) {
      onValidChange(false)
    }
  }, [value, selectedSymbol, onValidChange])

  const handleSelect = useCallback((symbol: string, name: string) => {
    const upperSymbol = symbol.toUpperCase()
    setQuery(upperSymbol)
    setSelectedSymbol(upperSymbol)
    onChange(upperSymbol)
    onSelect(upperSymbol)
    onValidChange(true)
    setIsOpen(false)
  }, [onChange, onSelect, onValidChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value.toUpperCase()
    setQuery(newQuery)
    onChange(newQuery)
    setIsOpen(true)
    
    // If user manually edits, invalidate selection
    if (selectedSymbol && newQuery !== selectedSymbol) {
      setSelectedSymbol(null)
      onValidChange(false)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <strong key={i} className="font-bold text-primary">{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 h-9 text-sm font-mono",
            isValid && selectedSymbol ? "border-green-500/50" : "",
            !isValid && query ? "border-red-500/50" : ""
          )}
          autoComplete="off"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-xl max-h-[400px] overflow-hidden">
          <div className="overflow-y-auto max-h-[400px]">
            {/* Local Match (Immediate) */}
            {localMatch && (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Match Found</span>
                </div>
                <button
                  onClick={() => handleSelect(localMatch.symbol, localMatch.name)}
                  className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                        {highlightText(localMatch.symbol, query)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {highlightText(localMatch.name, query)}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Popular Stocks (when empty or partial match) */}
            {(!query || filteredPopularStocks.length > 0) && !localMatch && (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Popular Stocks</span>
                </div>
                {filteredPopularStocks.slice(0, query ? 10 : 20).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol, stock.name)}
                    className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                          {highlightText(stock.symbol, query)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {highlightText(stock.name, query)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* API Search Results */}
            {shouldFetchAPI && (
              <div className="py-1">
                {isSearching && (
                  <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  </div>
                )}

                {!isSearching && apiResults && apiResults.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Results</span>
                    </div>
                    {apiResults.map((result: SearchResult) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSelect(result.symbol, result.name)}
                        className="w-full text-left px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                              <TrendingUp className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">
                                {highlightText(result.symbol, debouncedQuery)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {highlightText(result.name, debouncedQuery)}
                              </div>
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

                {!isSearching && apiResults && apiResults.length === 0 && debouncedQuery.length >= 2 && (
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}

