import { useState, useEffect, useMemo } from "react"
import { ArrowRightLeft, RefreshCw, Clock, Loader2, DollarSign } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { formatNumber, cn } from "../../lib/utils"
import { useExchangeRates, useDefaultCryptos, useCrypto } from "../../hooks/api"
import { useDashboardStore } from "../../stores/dashboard-store"

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
  const [activeTab, setActiveTab] = useState("fiat")
  
  // Fiat converter state
  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("ILS")
  
  // Crypto converter state
  const [cryptoAmount, setCryptoAmount] = useState("1")
  const [selectedCrypto, setSelectedCrypto] = useState("BTC")
  const [cryptoToCurrency, setCryptoToCurrency] = useState<"USD" | "ILS">("USD")
  
  const [lastUpdateDisplay, setLastUpdateDisplay] = useState("")

  // Fetch rates from REST API
  const { 
    data: rates = {}, 
    isLoading, 
    refetch,
    dataUpdatedAt,
  } = useExchangeRates()
  
  // Get WebSocket crypto data from store (real-time updates)
  const { cryptos: wsCryptos } = useDashboardStore()
  
  // Fetch default cryptos for the dropdown
  const { data: defaultCryptos = [], isLoading: isLoadingCryptos } = useDefaultCryptos()
  
  // Combine WebSocket data with API data for dropdown
  const availableCryptos = useMemo(() => {
    // Start with default cryptos from API
    const cryptoMap = new Map<string, typeof defaultCryptos[0]>()
    
    // Add default cryptos from API
    defaultCryptos.forEach(crypto => {
      cryptoMap.set(crypto.symbol, crypto)
    })
    
    // Override with WebSocket data if available (more up-to-date)
    Object.values(wsCryptos).forEach(crypto => {
      cryptoMap.set(crypto.symbol, {
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        change24h: crypto.change24h,
        changePercent24h: crypto.changePercent24h,
        image: crypto.image,
      })
    })
    
    return Array.from(cryptoMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [defaultCryptos, wsCryptos])
  
  // Get selected crypto price - prefer WebSocket data, fallback to API
  const selectedCryptoData = useMemo(() => {
    // First try WebSocket data (real-time)
    if (wsCryptos[selectedCrypto]) {
      return wsCryptos[selectedCrypto]
    }
    
    // Fallback to API data
    return defaultCryptos.find(c => c.symbol === selectedCrypto)
  }, [selectedCrypto, wsCryptos, defaultCryptos])
  
  // Fetch from API as fallback if WebSocket data not available
  const { data: apiCryptoData, isLoading: isLoadingCryptoPrice } = useCrypto(
    selectedCrypto, 
    activeTab === "crypto" && !selectedCryptoData
  )
  
  // Use WebSocket data if available, otherwise API data
  const cryptoData = selectedCryptoData || apiCryptoData

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
  
  // Calculate crypto conversion
  const cryptoPriceInUSD = cryptoData?.price || 0
  const cryptoPriceInILS = cryptoPriceInUSD * (rates["ILS"] || 0)
  const cryptoConvertedAmount = parseFloat(cryptoAmount || "0") * (cryptoToCurrency === "USD" ? cryptoPriceInUSD : cryptoPriceInILS)

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
            {activeTab === "fiat" ? "Open Exchange Rates" : "CryptoCompare"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex rounded-md border border-border overflow-hidden bg-muted/50">
            <TabsTrigger 
              value="fiat" 
              className={cn(
                "rounded-none h-8 px-3 text-xs font-medium flex-1 transition-all",
                activeTab === "fiat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              Fiat
            </TabsTrigger>
            <TabsTrigger 
              value="crypto"
              className={cn(
                "rounded-none h-8 px-3 text-xs font-medium flex-1 transition-all",
                activeTab === "crypto" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="mr-1.5">₿</span>
              Crypto
            </TabsTrigger>
          </div>
          
          {/* Fiat Tab Content */}
          <TabsContent value="fiat" className="mt-4 space-y-4">
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
          </TabsContent>
          
          {/* Crypto Tab Content */}
          <TabsContent value="crypto" className="mt-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="space-y-3">
                {/* Amount Input */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Amount
                  </label>
                  <Input
                    type="number"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    className="text-lg font-mono"
                    placeholder="Amount"
                  />
                </div>
                
                {/* Crypto Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Cryptocurrency
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                    disabled={isLoadingCryptos && availableCryptos.length === 0}
                  >
                    {isLoadingCryptos && availableCryptos.length === 0 ? (
                      <option>Loading cryptos...</option>
                    ) : availableCryptos.length === 0 ? (
                      <option>No cryptos available</option>
                    ) : (
                      availableCryptos.map((crypto) => (
                        <option key={crypto.symbol} value={crypto.symbol}>
                          {crypto.symbol} - {crypto.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                {/* Currency Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Convert to
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={cryptoToCurrency === "USD" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCryptoToCurrency("USD")}
                    >
                      USD
                    </Button>
                    <Button
                      variant={cryptoToCurrency === "ILS" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCryptoToCurrency("ILS")}
                    >
                      ILS
                    </Button>
                  </div>
                </div>
                
                {/* Result */}
                <div className="pt-2 border-t border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Value</div>
                  <div className="h-12 flex items-center px-3 bg-background border border-input rounded-md text-xl font-mono font-semibold">
                    {isLoadingCryptoPrice && !cryptoData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : cryptoConvertedAmount > 0 ? (
                      <>
                        {formatNumber(cryptoConvertedAmount, 2)} {cryptoToCurrency}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                  {cryptoPriceInUSD > 0 && (
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      1 {selectedCrypto} = {formatNumber(cryptoToCurrency === "USD" ? cryptoPriceInUSD : cryptoPriceInILS, 2)} {cryptoToCurrency}
                      {selectedCryptoData && (
                        <span className="ml-2 text-[10px] text-bullish">● Live</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
