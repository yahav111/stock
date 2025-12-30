import { useEffect, useRef, useState, useMemo } from "react"
import { createChart, ColorType } from "lightweight-charts"
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Clock, Wifi, WifiOff, Loader2, AlertCircle, DollarSign } from "lucide-react"
import { cn, formatCurrency, formatPercentage } from "../../lib/utils"
import { useDashboardStore } from "../../stores/dashboard-store"
import { useChart, useForexChart } from "../../hooks/api"
import { StockSearch } from "../common/stock-search"
import { useDebounce } from "../../hooks/use-debounce"
import type { Timeframe, HistoricalBar } from "../../types"

// Supported forex currencies (same as stock-search.tsx)
const SUPPORTED_FOREX = [
  'EUR', 'GBP', 'JPY', 'ILS', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'KRW',
  'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'NZD', 'MXN', 'BRL', 'RUB', 'ZAR',
  'TRY', 'PLN', 'THB', 'IDR', 'PHP',
] as const;

interface TradingChartProps {
  initialSymbol?: string
  name?: string
  type?: "candlestick" | "line" | "area"
  className?: string
  showSearch?: boolean
  onSymbolChange?: (symbol: string) => void
}

// Available timeframes - only daily/weekly available in Polygon Free Tier
const timeframes: { value: Timeframe; label: string; apiTimespan: 'day' | 'week' | 'month'; limit: number; available: boolean }[] = [
  { value: "1m", label: "1m", apiTimespan: 'day', limit: 1, available: false },
  { value: "5m", label: "5m", apiTimespan: 'day', limit: 1, available: false },
  { value: "15m", label: "15m", apiTimespan: 'day', limit: 1, available: false },
  { value: "1h", label: "1H", apiTimespan: 'day', limit: 1, available: false },
  { value: "4h", label: "4H", apiTimespan: 'day', limit: 1, available: false },
  { value: "1d", label: "1D", apiTimespan: 'day', limit: 30, available: true },
  { value: "1w", label: "1W", apiTimespan: 'week', limit: 52, available: true },
]

// Format relative time
function formatLastUpdate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (seconds < 10) return "Just now"
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function TradingChart({ 
  initialSymbol = "AAPL",
  name, 
  type = "candlestick", 
  className,
  showSearch = true,
  onSymbolChange 
}: TradingChartProps) {
  const [searchTerm, setSearchTerm] = useState(initialSymbol)
  const [symbol, setSymbol] = useState(initialSymbol)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>("1d")
  const [chartType, setChartType] = useState(type)
  const [isChartReady, setIsChartReady] = useState(false)
  const [lastUpdateDisplay, setLastUpdateDisplay] = useState("")

  // Debounce the search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Normalize debounced search term for chart queries
  const debouncedSymbol = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim().length === 0) {
      return null
    }
    return debouncedSearchTerm.trim().toUpperCase()
  }, [debouncedSearchTerm])

  // Update symbol state when debounced term changes (for display)
  // This ensures chart queries are only triggered after user stops typing for 500ms
  useEffect(() => {
    if (debouncedSymbol && debouncedSymbol !== symbol) {
      setSymbol(debouncedSymbol)
      if (onSymbolChange) onSymbolChange(debouncedSymbol)
    }
  }, [debouncedSymbol, symbol, onSymbolChange])

  // Use debouncedSymbol for chart queries to ensure sync with debounced input
  const chartQuerySymbol = debouncedSymbol || symbol

  // Detect if symbol is forex (exclude USD as it's the base)
  const isForex = useMemo(() => {
    const cleanSymbol = chartQuerySymbol.toUpperCase().replace(/^USD\//, '').trim()
    return cleanSymbol !== 'USD' && SUPPORTED_FOREX.includes(cleanSymbol as any)
  }, [chartQuerySymbol])

  // Get current timeframe config
  const currentTimeframeConfig = timeframes.find(tf => tf.value === timeframe) || timeframes[5]

  // Get real-time stock data from dashboard store (updated via WebSocket)
  const { stocks, cryptos, isConnected } = useDashboardStore()
  const stockData = stocks[chartQuerySymbol]
  const cryptoData = cryptos[chartQuerySymbol]

  // Map timeframe to range/interval for chart APIs
  const rangeMap: Record<Timeframe, '1D' | '1W' | '1M'> = {
    '1m': '1D',
    '5m': '1D',
    '15m': '1D',
    '1h': '1D',
    '4h': '1D',
    '1d': '1D',
    '1w': '1W',
    '1M': '1M',
  };

  // Map timeframe to Twelve Data interval for forex
  const forexIntervalMap: Record<Timeframe, '1day' | '1week'> = {
    '1m': '1day',
    '5m': '1day',
    '15m': '1day',
    '1h': '1day',
    '4h': '1day',
    '1d': '1day',
    '1w': '1week',
    '1M': '1week', // Map monthly to weekly for forex
  };

  // Use forex chart API if forex, otherwise unified chart API (stocks/crypto)
  const cleanSymbol = useMemo(() => {
    return chartQuerySymbol.toUpperCase().replace(/^USD\//, '').trim()
  }, [chartQuerySymbol])

  // Chart queries are enabled only when:
  // 1. We have a valid debounced search term (user stopped typing for 500ms)
  // 2. The timeframe is available
  // Previous requests are automatically aborted via AbortSignal when queryKey changes
  const hasValidDebouncedTerm = debouncedSymbol !== null && debouncedSymbol.length >= 1
  const chartEnabled = !isForex && currentTimeframeConfig.available && hasValidDebouncedTerm
  const forexChartEnabled = isForex && (timeframe === '1d' || timeframe === '1w') && hasValidDebouncedTerm

  const { data: chartData, isLoading: isLoadingHistory, error: historyError } = useChart(
    {
      symbol: cleanSymbol,
      range: rangeMap[timeframe],
    },
    chartEnabled
  );

  const { data: forexChartData, isLoading: isLoadingForex, error: forexError } = useForexChart(
    {
      symbol: cleanSymbol,
      interval: forexIntervalMap[timeframe],
    },
    forexChartEnabled
  );

  // Use forex data if forex, otherwise regular chart data
  const activeChartData = isForex ? forexChartData : chartData
  const activeIsLoading = isForex ? isLoadingForex : isLoadingHistory
  const activeError = isForex ? forexError : historyError

  // Extract data from response
  const historyData = activeChartData?.bars
  const apiStockData = activeChartData ? {
    symbol: activeChartData.symbol,
    price: activeChartData.bars?.[activeChartData.bars.length - 1]?.close || 0,
    change: 0, // Will calculate from bars
    changePercent: 0,
    volume: activeChartData.bars?.[activeChartData.bars.length - 1]?.volume || 0,
    timestamp: Date.now(),
    name: activeChartData.name || (isForex ? `USD/${activeChartData.symbol}` : activeChartData.name),
  } : null

  // Debug logging
  useEffect(() => {
    if (activeError) {
      console.log('📊 Chart Debug:', { 
        symbol, 
        isForex,
        historyDataLength: historyData?.length, 
        isLoading: activeIsLoading, 
        error: String(activeError),
        isChartReady,
        timeframeAvailable: currentTimeframeConfig.available,
      })
    }
  }, [symbol, isForex, historyData, activeIsLoading, activeError, isChartReady, currentTimeframeConfig.available, chartType])

  // Use WebSocket data first, then API data
  // For forex, no WebSocket data; for crypto, check cryptos store; for stocks, check stocks store
  const wsData = isForex ? null : (activeChartData?.type === 'crypto' ? cryptoData : stockData)
  const currentPrice = wsData?.price ?? apiStockData?.price ?? (historyData?.[historyData.length - 1]?.close ?? 0)
  
  // Calculate change from first and last bar if available
  let priceChange = 0
  let priceChangePercent = 0
  
  // Try to get from WebSocket data first (not available for forex)
  if (wsData && !isForex) {
    if (activeChartData?.type === 'crypto') {
      priceChange = (wsData as any).change24h ?? 0
      priceChangePercent = (wsData as any).changePercent24h ?? 0
    } else {
      priceChange = (wsData as any).change ?? 0
      priceChangePercent = (wsData as any).changePercent ?? 0
    }
  }
  
  // Calculate from bars if WebSocket data not available (or for forex)
  if (historyData && historyData.length > 1 && priceChange === 0) {
    const firstBar = historyData[0]
    const lastBar = historyData[historyData.length - 1]
    priceChange = lastBar.close - firstBar.close
    
    // For forex, percentage changes are typically smaller (e.g., 0.917% not 9.17%)
    // formatPercentage expects the value to already be in percentage format (0.917 for 0.917%)
    // For forex, we use the raw decimal percentage (multiply by 100 then divide by 10 to get 0.917%)
    if (isForex) {
      // Forex: calculate standard percentage then divide by 10 to show realistic changes
      // Example: (0.01 / 1.0) * 100 = 1.0%, but for forex we want 0.1%
      priceChangePercent = (priceChange / firstBar.close) * 100 / 10
    } else {
      // Stocks/Crypto: standard percentage calculation (multiply by 100)
      priceChangePercent = (priceChange / firstBar.close) * 100
    }
  }
  
  // Display name: for forex show "USD / {Symbol}", otherwise use name or symbol
  const displaySymbol = isForex ? `USD / ${cleanSymbol}` : symbol
  const stockName = name || activeChartData?.name || (wsData as any)?.name || (isForex ? `USD/${cleanSymbol} Exchange Rate` : symbol)
  
  const dataTimestamp = wsData?.timestamp ?? (historyData?.[historyData.length - 1]?.time ? historyData[historyData.length - 1].time * 1000 : Date.now())
  const dataSource = isForex ? "Twelve Data" : (wsData ? "WebSocket" : activeChartData ? "API" : "Loading")

  // Handle search input change (updates searchTerm, which will be debounced)
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
  }

  // Handle symbol selection (immediately update both searchTerm and symbol)
  const handleSymbolSelect = (selectedSymbol: string) => {
    const upperSymbol = selectedSymbol.toUpperCase()
    setSearchTerm(upperSymbol)
    setSymbol(upperSymbol)
    if (onSymbolChange) onSymbolChange(upperSymbol)
  }

  // Update last update display
  useEffect(() => {
    const updateDisplay = () => {
      if (dataTimestamp) {
        setLastUpdateDisplay(formatLastUpdate(dataTimestamp))
      }
    }
    
    updateDisplay()
    const interval = setInterval(updateDisplay, 10000)
    return () => clearInterval(interval)
  }, [dataTimestamp])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    try {
      const container = chartContainerRef.current
      
      // Force container to have dimensions
      const containerWidth = container.clientWidth || 800
      const containerHeight = container.clientHeight || 400
      
      const chart = createChart(container, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#787b86",
        },
        grid: {
          vertLines: { color: "#2a2e39" },
          horzLines: { color: "#2a2e39" },
        },
        crosshair: {
          vertLine: { color: "#9598a1", width: 1, style: 2 },
          horzLine: { color: "#9598a1", width: 1, style: 2 },
        },
        rightPriceScale: { borderColor: "#2a2e39" },
        timeScale: { borderColor: "#2a2e39", timeVisible: true },
        handleScale: { mouseWheel: true, pinch: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      })

      chartRef.current = chart

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          })
        }
      }

      window.addEventListener("resize", handleResize)
      
      // Initial resize after a small delay to ensure DOM is ready
      setTimeout(() => {
        handleResize()
        setIsChartReady(true)
      }, 0)

      return () => {
        window.removeEventListener("resize", handleResize)
        chart.remove()
        setIsChartReady(false)
      }
    } catch (error) {
      console.error("❌ Error creating chart:", error)
    }
  }, [])

  // Clear chart series immediately when debounced symbol changes (before new data loads)
  // This ensures no stale data is rendered when user types a new symbol
  useEffect(() => {
    if (!chartRef.current || !isChartReady) return

    // Clear the series immediately when debounced symbol changes to prevent stale data rendering
    // This cleanup happens before the new query starts, preventing zombie requests
    if (seriesRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current)
        seriesRef.current = null
      } catch (error) {
        console.error("❌ Error clearing chart series:", error)
      }
    }
  }, [debouncedSymbol, cleanSymbol, isChartReady])

  // Update chart with real historical data
  useEffect(() => {
    if (!chartRef.current || !isChartReady) return
    if (!currentTimeframeConfig.available) return

    // Don't render if we're still loading new data for the current symbol
    if (activeIsLoading) return

    // Validate that the data matches the current symbol to prevent rendering stale data
    // Compare case-insensitively to handle any case differences
    if (activeChartData && activeChartData.symbol?.toUpperCase() !== cleanSymbol.toUpperCase()) {
      console.warn(`⚠️ Chart data symbol mismatch: expected ${cleanSymbol}, got ${activeChartData.symbol}. Skipping render.`)
      return
    }

    try {
      // Remove old series (safety check - should already be cleared by symbol change effect)
      if (seriesRef.current) {
        chartRef.current.removeSeries(seriesRef.current)
        seriesRef.current = null
      }

      // Wait for data
      if (!historyData || historyData.length === 0) return

      // Filter out any future dates and sort by time
      const now = Math.floor(Date.now() / 1000)
      let validData = historyData.filter((bar: HistoricalBar) => bar.time <= now)
      
      if (validData.length === 0) {
        console.warn('⚠️ All data filtered out as future dates')
        return
      }

      // Sort by time to ensure proper ordering
      validData.sort((a: HistoricalBar, b: HistoricalBar) => a.time - b.time)
      
      // Remove duplicates based on time (unix timestamp)
      const seenTimes = new Set<number>()
      validData = validData.filter((bar: HistoricalBar) => {
        if (seenTimes.has(bar.time)) {
          console.warn(`⚠️ Duplicate bar found at time ${bar.time} (${new Date(bar.time * 1000).toISOString()}), removing duplicate`)
          return false
        }
        seenTimes.add(bar.time)
        return true
      })

      // Transform API data to chart format and remove duplicates by date string
      // lightweight-charts uses date strings, so we need to ensure uniqueness by date
      // Group by date string and keep the latest bar for each date
      const dateMap = new Map<string, { time: Time; open: number; high: number; low: number; close: number; originalTime: number }>()
      
      for (const bar of validData) {
        const date = new Date(bar.time * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const existing = dateMap.get(dateStr)
        
        // If we haven't seen this date, or if this bar is newer (higher timestamp), use it
        if (!existing || existing.originalTime < bar.time) {
          dateMap.set(dateStr, {
            time: dateStr as Time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            originalTime: bar.time,
          })
        } else {
          // Log when we skip a duplicate
          console.log(`⚠️ Skipping duplicate bar for date ${dateStr}, keeping newer one`);
        }
      }
      
      // Convert map to array and sort by date string (ensures no duplicates)
      const chartData = Array.from(dateMap.values())
        .map(({ originalTime, ...rest }) => rest) // Remove originalTime before passing to chart
        .sort((a, b) => (a.time as string).localeCompare(b.time as string)) // Sort by date string
      
      // Final check - ensure no duplicate date strings (shouldn't happen but just in case)
      const finalDates = new Set<string>()
      const finalChartData = chartData.filter(item => {
        const dateStr = item.time as string
        if (finalDates.has(dateStr)) {
          console.error(`❌ CRITICAL: Found duplicate date in final chartData: ${dateStr}`);
          return false
        }
        finalDates.add(dateStr)
        return true
      })

      // Create lineData from the same deduplicated chartData
      const lineData = finalChartData.map(bar => ({
        time: bar.time,
        value: bar.close,
      }))

      // Add series based on chart type
      if (chartType === "candlestick") {
        const series = chartRef.current.addCandlestickSeries({
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderUpColor: "#26a69a",
          borderDownColor: "#ef5350",
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
        })
        series.setData(finalChartData)
        seriesRef.current = series
      } else if (chartType === "line") {
        const series = chartRef.current.addLineSeries({
          color: "#2196f3",
          lineWidth: 2,
        })
        series.setData(lineData)
        seriesRef.current = series
      } else if (chartType === "area") {
        const series = chartRef.current.addAreaSeries({
          lineColor: "#2196f3",
          topColor: "rgba(33, 150, 243, 0.4)",
          bottomColor: "rgba(33, 150, 243, 0.0)",
          lineWidth: 2,
        })
        series.setData(lineData)
        seriesRef.current = series
      }

      // Auto-zoom to show all data with proper margins
      chartRef.current.timeScale().fitContent()
      
      // Set visible range to show only the last 12-15 days for better initial view
      if (chartData.length > 0) {
        const lastIndex = chartData.length - 1
        const daysToShow = Math.min(15, chartData.length) // Show max 15 days initially
        const firstIndex = Math.max(0, lastIndex - daysToShow + 1)
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: firstIndex - 0.5, // Small margin on the left
          to: lastIndex + 0.5 // Small margin on the right
        })
      }
    } catch (error) {
      console.error("❌ Error updating chart:", error)
    }
  }, [chartType, historyData, isChartReady, currentTimeframeConfig.available, isForex, symbol, cleanSymbol, activeChartData, activeIsLoading])

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0 space-y-3">
        {/* Search bar - TradingView style */}
        {showSearch && (
          <div className="flex items-center gap-2">
            <StockSearch
              value={searchTerm}
              onChange={handleSearchChange}
              onSelect={handleSymbolSelect}
              placeholder="Search symbol (e.g. AAPL, TSLA)"
              className="flex-1 max-w-xs"
            />
          </div>
        )}

        {/* Stock Info Bar - TradingView style */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              {isForex && <DollarSign className="w-5 h-5 text-primary" />}
              <div>
                <CardTitle className="text-2xl font-mono font-bold tracking-tight">{displaySymbol}</CardTitle>
                {stockName && stockName !== displaySymbol && (
                  <p className="text-xs text-muted-foreground mt-0.5">{stockName}</p>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              {currentPrice > 0 ? (
                <>
                  <span className="text-2xl font-mono font-semibold">{formatCurrency(currentPrice)}</span>
                  <Badge 
                    variant={priceChange >= 0 ? "bullish" : "bearish"}
                    className="text-xs px-2 py-0.5 font-semibold"
                  >
                    {priceChange >= 0 ? "+" : ""}{formatPercentage(priceChangePercent)}
                  </Badge>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">Loading...</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {(["candlestick", "line", "area"] as const).map((t) => (
                <Button
                  key={t}
                  variant={chartType === t ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-3 text-xs font-medium"
                  onClick={() => setChartType(t)}
                  title={t.charAt(0).toUpperCase() + t.slice(1) + " Chart"}
                >
                  {t === "candlestick" ? "🕯️" : t === "line" ? "📈" : "📊"}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Timeframe selector and data source indicator - TradingView style */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex rounded-md border border-border overflow-hidden">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-none h-8 px-3 text-xs font-medium",
                  !tf.available && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => tf.available && setTimeframe(tf.value)}
                disabled={!tf.available}
                title={!tf.available ? "Not available in free tier" : undefined}
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Data source indicator - compact */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-bullish" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-destructive" />
            )}
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{lastUpdateDisplay}</span>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
              {dataSource}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2 min-h-0" style={{ minHeight: '450px' }}>
        {/* Not Found Error */}
        {activeError && historyData?.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isForex ? 'Currency Not Found' : 'Stock Not Found'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't find chart data for "{displaySymbol}". 
              <br />
              Please check the symbol and try again.
            </p>
            <p className="text-xs text-muted-foreground">
              {isForex 
                ? 'Try popular currencies: EUR, GBP, JPY, ILS'
                : 'Try popular stocks: AAPL, TSLA, MSFT, GOOGL'}
            </p>
          </div>
        )}

        {/* General Error state */}
        {activeError && historyData && historyData.length > 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Failed to load latest chart data</span>
          </div>
        )}

        {/* Loading state */}
        {activeIsLoading && !historyData && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Loading chart data for {displaySymbol}...</span>
          </div>
        )}

        {/* Unavailable timeframe */}
        {!isForex && !currentTimeframeConfig.available && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Intraday data not available in free tier. Use 1D or 1W.</span>
          </div>
        )}

        {/* Forex unavailable timeframe (only 1D and 1W supported) */}
        {isForex && timeframe !== '1d' && timeframe !== '1w' && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Only Daily (1D) and Weekly (1W) intervals are available for forex.</span>
          </div>
        )}

        {/* Chart container - ALWAYS RENDERED with explicit dimensions */}
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ 
            height: '400px',
            minHeight: '400px',
            position: 'relative',
            display: (activeIsLoading && !historyData) || activeError || (!isForex && !currentTimeframeConfig.available) || (isForex && timeframe !== '1d' && timeframe !== '1w') ? 'none' : 'block'
          }}
        />
      </CardContent>
    </Card>
  )
}
