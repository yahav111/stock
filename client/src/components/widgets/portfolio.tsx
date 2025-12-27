import { useState, useMemo, useEffect } from "react"
import { Plus, Trash2, Edit2, X, Check, AlertCircle, DollarSign, TrendingUp, Radio, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { LoadingSpinner } from "../common/loading-spinner"
import { PortfolioStockSearch } from "../common/portfolio-stock-search"
import { cn, formatCurrency, formatPercentage, getChangeColor, formatNumber } from "../../lib/utils"
import { usePortfolio, useAddPortfolioEntry, useDeletePortfolioEntry, useUpdatePortfolioEntry, useSetInitialCash } from "../../hooks/api/use-portfolio"
import { useStock } from "../../hooks/api/use-stocks"
import { useSubscription } from "../../hooks/use-websocket"
import { useDashboardStore } from "../../stores/dashboard-store"
import type { PortfolioEntry } from "../../types"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function Portfolio() {
  const { data, isLoading, error } = usePortfolio()
  const addEntry = useAddPortfolioEntry()
  const deleteEntry = useDeletePortfolioEntry()
  const updateEntry = useUpdatePortfolioEntry()
  const setInitialCash = useSetInitialCash()
  const { stocks } = useDashboardStore()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isInitialCashDialogOpen, setIsInitialCashDialogOpen] = useState(false)
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
  })
  const [editFormData, setEditFormData] = useState({
    shares: "",
    averagePrice: "",
  })
  const [initialCashInput, setInitialCashInput] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSymbolValid, setIsSymbolValid] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")

  // Fetch current price when symbol is selected
  const { data: stockQuote, isLoading: isLoadingPrice } = useStock(
    selectedSymbol,
    !!selectedSymbol && isSymbolValid
  )

  // Get real-time price from WebSocket if available
  const realTimeStock = stocks[selectedSymbol]
  const currentPrice = realTimeStock?.price || stockQuote?.price || 0

  // Get portfolio symbols for WebSocket subscription
  const portfolioSymbols = useMemo(() => {
    return data?.entries?.map(entry => entry.symbol) || []
  }, [data?.entries])

  // Subscribe to WebSocket updates for portfolio stocks
  useSubscription({ channel: "stocks", symbols: portfolioSymbols })

  // Subscribe to selected symbol for real-time price updates in modal
  useSubscription({ 
    channel: "stocks", 
    symbols: selectedSymbol && isSymbolValid ? [selectedSymbol] : [] 
  })

  // Merge portfolio data with real-time WebSocket updates
  const entriesWithRealTimePrices = useMemo(() => {
    if (!data?.entries) return []
    
    return data.entries.map(entry => {
      const realTimeStock = stocks[entry.symbol]
      const currentPrice = realTimeStock?.price || entry.currentPrice
      
      // Calculate gain/loss with real-time price
      const gainLoss = (currentPrice - entry.averagePrice) * entry.shares
      const gainLossPercent = entry.averagePrice > 0 
        ? ((currentPrice - entry.averagePrice) / entry.averagePrice) * 100 
        : 0
      
      return {
        ...entry,
        currentPrice,
        gainLoss,
        gainLossPercent,
      }
    })
  }, [data?.entries, stocks])

  // Calculate summary with real-time prices
  const summaryWithRealTime = useMemo(() => {
    if (!entriesWithRealTimePrices.length) return data?.summary || null
    
    const totalValue = entriesWithRealTimePrices.reduce(
      (sum, entry) => sum + (entry.currentPrice * entry.shares), 
      0
    )
    const totalCost = entriesWithRealTimePrices.reduce(
      (sum, entry) => sum + (entry.averagePrice * entry.shares), 
      0
    )
    const totalGainLoss = entriesWithRealTimePrices.reduce(
      (sum, entry) => sum + entry.gainLoss, 
      0
    )
    const totalGainLossPercent = totalCost > 0 
      ? ((totalValue - totalCost) / totalCost) * 100 
      : 0
    
    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
    }
  }, [entriesWithRealTimePrices, data?.summary])

  const handleAdd = async () => {
    if (!formData.symbol || !formData.shares || !currentPrice || !isSymbolValid) return
    
    setErrorMessage(null)
    try {
      await addEntry.mutateAsync({
        symbol: formData.symbol.toUpperCase(),
        shares: parseFloat(formData.shares),
        averagePrice: currentPrice, // Use current price as average price
      })
      setFormData({ symbol: "", shares: "" })
      setSelectedSymbol("")
      setIsSymbolValid(false)
      setIsAddDialogOpen(false)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to add portfolio entry"
      setErrorMessage(errorMsg)
      console.error("Failed to add portfolio entry:", error)
    }
  }

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol)
    setFormData({ ...formData, symbol })
    setIsSymbolValid(true)
  }

  // Reset selected symbol when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedSymbol("")
      setIsSymbolValid(false)
    }
  }, [isAddDialogOpen])

  const handleSetInitialCash = async () => {
    if (!initialCashInput) return
    
    setErrorMessage(null)
    try {
      await setInitialCash.mutateAsync({
        initialCash: parseFloat(initialCashInput),
      })
      setInitialCashInput("")
      setIsInitialCashDialogOpen(false)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to set initial cash"
      setErrorMessage(errorMsg)
      console.error("Failed to set initial cash:", error)
    }
  }

  const handleDelete = async (symbol: string) => {
    if (!confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) return
    
    try {
      await deleteEntry.mutateAsync(symbol)
    } catch (error) {
      console.error("Failed to delete portfolio entry:", error)
    }
  }

  const handleStartEdit = (entry: PortfolioEntry) => {
    setEditingSymbol(entry.symbol)
    setEditFormData({
      shares: entry.shares.toString(),
      averagePrice: entry.averagePrice.toString(),
    })
  }

  const handleCancelEdit = () => {
    setEditingSymbol(null)
    setEditFormData({ shares: "", averagePrice: "" })
  }

  const handleSaveEdit = async (symbol: string) => {
    setErrorMessage(null)
    try {
      await updateEntry.mutateAsync({
        symbol,
        ...(editFormData.shares && { shares: parseFloat(editFormData.shares) }),
        ...(editFormData.averagePrice && { averagePrice: parseFloat(editFormData.averagePrice) }),
      })
      setEditingSymbol(null)
      setEditFormData({ shares: "", averagePrice: "" })
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to update portfolio entry"
      setErrorMessage(errorMsg)
      console.error("Failed to update portfolio entry:", error)
    }
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Failed to load portfolio</div>
        </CardContent>
      </Card>
    )
  }

  const entries = entriesWithRealTimePrices
  const summary = summaryWithRealTime
  const balance = data?.balance

  // Calculate investment amount for validation (using current price)
  const calculateInvestmentAmount = () => {
    if (!formData.shares || !currentPrice) return 0
    return parseFloat(formData.shares) * currentPrice
  }

  const investmentAmount = calculateInvestmentAmount()
  const hasInsufficientCash = balance && investmentAmount > balance.cash

  // Pie chart data
  const pieData = balance && (balance.cash > 0 || balance.invested > 0) ? [
    { name: "Cash", value: balance.cash, color: "#26a69a" },
    { name: "Invested", value: balance.invested, color: "#2196f3" },
  ] : []

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Portfolio</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isInitialCashDialogOpen} onOpenChange={setIsInitialCashDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Set Initial Cash
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Initial Cash</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="initialCash">Initial Cash Amount</Label>
                    <Input
                      id="initialCash"
                      type="number"
                      step="0.01"
                      placeholder="10000.00"
                      value={initialCashInput}
                      onChange={(e) => setInitialCashInput(e.target.value)}
                    />
                    {balance && balance.invested > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current invested: {formatCurrency(balance.invested)}. Initial cash must be at least this amount.
                      </p>
                    )}
                  </div>
                  {errorMessage && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                      {errorMessage}
                    </div>
                  )}
                  <Button
                    onClick={handleSetInitialCash}
                    disabled={setInitialCash.isPending || !initialCashInput}
                    className="w-full"
                  >
                    {setInitialCash.isPending ? "Setting..." : "Set Initial Cash"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Stock to Portfolio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <PortfolioStockSearch
                    value={formData.symbol}
                    onChange={(symbol) => setFormData({ ...formData, symbol })}
                    onSelect={handleSymbolSelect}
                    isValid={isSymbolValid}
                    onValidChange={setIsSymbolValid}
                    placeholder="Search stocks... (e.g. AAPL, TSLA)"
                  />
                  {!isSymbolValid && formData.symbol && (
                    <p className="text-xs text-destructive mt-1">
                      Please select a stock from the dropdown
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shares">Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={formData.shares}
                    onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="currentPrice" className="flex items-center gap-2">
                    <span>Current Price</span>
                    {isSymbolValid && currentPrice > 0 && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Radio className="w-3 h-3 fill-green-500 text-green-500" />
                        <span className="font-mono">Live</span>
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPrice"
                      type="text"
                      value={isLoadingPrice ? "Loading..." : currentPrice > 0 ? formatCurrency(currentPrice) : "—"}
                      disabled
                      className="font-mono bg-muted/50 cursor-not-allowed pr-10"
                    />
                    {isLoadingPrice && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  {!isSymbolValid && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a stock to see current price
                    </p>
                  )}
                </div>
                {balance && (
                  <div className="p-3 bg-muted/50 rounded-md space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Available Cash</div>
                      <div className="text-sm font-semibold font-mono">{formatCurrency(balance.cash)}</div>
                    </div>
                    {investmentAmount > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                        <div className={cn(
                          "text-sm font-semibold font-mono",
                          hasInsufficientCash ? "text-destructive" : ""
                        )}>
                          {formatCurrency(investmentAmount)}
                        </div>
                        {hasInsufficientCash && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Insufficient funds</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}
                <Button
                  onClick={handleAdd}
                  disabled={addEntry.isPending || !formData.symbol || !formData.shares || !currentPrice || hasInsufficientCash || !isSymbolValid || isLoadingPrice}
                  className="w-full"
                >
                  {addEntry.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {balance && balance.initialCash === 0 && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Please set your initial cash amount to start tracking investments.</span>
            </div>
          </div>
        )}

        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Balance Overview */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Cash (נזיל)</span>
                </div>
                <div className="text-lg font-semibold">{formatCurrency(balance.cash)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Invested (מושקע)</span>
                </div>
                <div className="text-lg font-semibold">{formatCurrency(balance.invested)}</div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Portfolio Value</span>
                  <span className="text-sm font-semibold">{formatCurrency(balance.cash + summary?.totalValue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-3 text-center">Cash vs Invested</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Value (Invested)</div>
              <div className="text-lg font-semibold">{formatCurrency(summary.totalValue)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Gain/Loss</div>
              <div className={cn("text-lg font-semibold", getChangeColor(summary.totalGainLoss))}>
                {formatCurrency(summary.totalGainLoss)} ({formatPercentage(summary.totalGainLossPercent)})
              </div>
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No stocks in your portfolio yet.</p>
            <p className="text-sm mt-2">Click "Add Stock" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Shares</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Avg Price</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Current</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Gain/Loss</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">%</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.symbol} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <div className="font-semibold">{entry.symbol}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {editingSymbol === entry.symbol ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.shares}
                          onChange={(e) => setEditFormData({ ...editFormData, shares: e.target.value })}
                          className="w-20 h-7 text-right"
                        />
                      ) : (
                        formatNumber(entry.shares, 4)
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {editingSymbol === entry.symbol ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.averagePrice}
                          onChange={(e) => setEditFormData({ ...editFormData, averagePrice: e.target.value })}
                          className="w-24 h-7 text-right"
                        />
                      ) : (
                        formatCurrency(entry.averagePrice)
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {formatCurrency(entry.currentPrice)}
                    </td>
                    <td className={cn("py-3 px-2 text-right font-mono text-sm", getChangeColor(entry.gainLoss))}>
                      {formatCurrency(entry.gainLoss)}
                    </td>
                    <td className={cn("py-3 px-2 text-right font-mono text-sm", getChangeColor(entry.gainLoss))}>
                      {formatPercentage(entry.gainLossPercent)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        {editingSymbol === entry.symbol ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleSaveEdit(entry.symbol)}
                              disabled={updateEntry.isPending}
                            >
                              <Check className="w-3 h-3 text-green-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(entry)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(entry.symbol)}
                              disabled={deleteEntry.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

