import { useState } from "react"
import { Plus, Trash2, Edit2, X, Check } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { LoadingSpinner } from "../common/loading-spinner"
import { cn, formatCurrency, formatPercentage, getChangeColor, formatNumber } from "../../lib/utils"
import { usePortfolio, useAddPortfolioEntry, useDeletePortfolioEntry, useUpdatePortfolioEntry } from "../../hooks/api/use-portfolio"
import type { PortfolioEntry } from "../../types"

export function Portfolio() {
  const { data, isLoading, error } = usePortfolio()
  const addEntry = useAddPortfolioEntry()
  const deleteEntry = useDeletePortfolioEntry()
  const updateEntry = useUpdatePortfolioEntry()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    averagePrice: "",
  })
  const [editFormData, setEditFormData] = useState({
    shares: "",
    averagePrice: "",
  })

  const handleAdd = async () => {
    if (!formData.symbol || !formData.shares || !formData.averagePrice) return
    
    try {
      await addEntry.mutateAsync({
        symbol: formData.symbol.toUpperCase(),
        shares: parseFloat(formData.shares),
        averagePrice: parseFloat(formData.averagePrice),
      })
      setFormData({ symbol: "", shares: "", averagePrice: "" })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add portfolio entry:", error)
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
    try {
      await updateEntry.mutateAsync({
        symbol,
        ...(editFormData.shares && { shares: parseFloat(editFormData.shares) }),
        ...(editFormData.averagePrice && { averagePrice: parseFloat(editFormData.averagePrice) }),
      })
      setEditingSymbol(null)
      setEditFormData({ shares: "", averagePrice: "" })
    } catch (error) {
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

  const entries = data?.entries || []
  const summary = data?.summary

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Portfolio</CardTitle>
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
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  />
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
                  />
                </div>
                <div>
                  <Label htmlFor="averagePrice">Average Price</Label>
                  <Input
                    id="averagePrice"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={formData.averagePrice}
                    onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={addEntry.isPending || !formData.symbol || !formData.shares || !formData.averagePrice}
                  className="w-full"
                >
                  {addEntry.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Value</div>
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

