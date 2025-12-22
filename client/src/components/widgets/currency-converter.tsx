import { useState, useEffect } from "react"
import { ArrowRightLeft, RefreshCw, Clock, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { formatNumber } from "../../lib/utils"
import { useExchangeRates } from "../../hooks/api"

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CNY", name: "Chinese Yuan" },
]

// Format relative time
function formatLastUpdate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("ILS")
  const [lastUpdateDisplay, setLastUpdateDisplay] = useState("")

  // Fetch rates from REST API
  const { 
    data: rates = {}, 
    isLoading, 
    refetch,
    dataUpdatedAt,
  } = useExchangeRates()

  // Update last update display
  useEffect(() => {
    const updateDisplay = () => {
      if (dataUpdatedAt) {
        setLastUpdateDisplay(formatLastUpdate(dataUpdatedAt))
      }
    }
    
    updateDisplay()
    const interval = setInterval(updateDisplay, 30000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  // Calculate rate between two currencies
  const getRate = (from: string, to: string): number => {
    if (from === to) return 1
    if (!rates[from] || !rates[to]) return 0
    
    // All rates are relative to USD
    // To convert from A to B: (amount / rate_A) * rate_B
    if (from === "USD") return rates[to] || 0
    if (to === "USD") return 1 / (rates[from] || 1)
    
    // Cross rate
    return (rates[to] || 0) / (rates[from] || 1)
  }

  const rate = getRate(fromCurrency, toCurrency)
  const convertedAmount = parseFloat(amount || "0") * rate

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  // Popular currency pairs to display
  const popularPairs = [
    { from: "USD", to: "EUR" },
    { from: "USD", to: "GBP" },
    { from: "USD", to: "ILS" },
    { from: "USD", to: "JPY" },
    { from: "EUR", to: "GBP" },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Currency Converter
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {/* Data source indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          <span>
            {isLoading ? "Loading..." : `Updated ${lastUpdateDisplay}`}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Open Exchange Rates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Converter */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-mono"
                placeholder="Amount"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="mt-2 w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="ghost" size="icon" onClick={swapCurrencies}>
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <div className="h-9 flex items-center px-3 bg-background border border-input rounded-md text-lg font-mono">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : rate > 0 ? (
                  formatNumber(convertedAmount, 2)
                ) : (
                  "—"
                )}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="mt-2 w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {rate > 0 ? (
              <>1 {fromCurrency} = {formatNumber(rate, 4)} {toCurrency}</>
            ) : (
              "Loading rates..."
            )}
          </div>
        </div>

        {/* Popular pairs */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-2">Popular Rates</div>
          {popularPairs.map((pair) => {
            const pairRate = getRate(pair.from, pair.to)
            return (
              <div 
                key={`${pair.from}/${pair.to}`}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                onClick={() => {
                  setFromCurrency(pair.from)
                  setToCurrency(pair.to)
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{pair.from}</span>
                  <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                  <span className="font-semibold text-sm">{pair.to}</span>
                </div>
                <span className="font-mono text-sm">
                  {pairRate > 0 ? formatNumber(pairRate, 4) : "—"}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
