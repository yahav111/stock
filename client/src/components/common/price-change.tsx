import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn, formatPercentage, getChangeColor } from "../../lib/utils"

interface PriceChangeProps {
  change: number
  changePercent: number
  showIcon?: boolean
  showBadge?: boolean
  className?: string
}

export function PriceChange({
  change,
  changePercent,
  showIcon = true,
  showBadge = false,
  className,
}: PriceChangeProps) {
  const isPositive = change > 0
  const isNeutral = change === 0
  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown

  if (showBadge) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
          isPositive
            ? "bg-bullish/20 text-bullish"
            : isNeutral
            ? "bg-muted text-muted-foreground"
            : "bg-bearish/20 text-bearish",
          className
        )}
      >
        {showIcon && <Icon className="w-3 h-3" />}
        <span>{formatPercentage(changePercent)}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", getChangeColor(change), className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span className="text-sm font-mono">{formatPercentage(changePercent)}</span>
    </div>
  )
}

