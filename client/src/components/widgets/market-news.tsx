/**
 * Market News Widget
 * Displays market news from Finnhub API with polling every 2-3 minutes
 */
import { useNews } from "../../hooks/api"
import { Loader2, ExternalLink, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import type { MarketNews } from "../../types"

interface MarketNewsProps {
  category?: 'general' | 'forex' | 'crypto' | 'merger'
  maxItems?: number
  className?: string
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function NewsItem({ news }: { news: MarketNews }) {
  return (
    <article className="group p-4 border-b border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {news.headline}
          </h3>
          
          {news.summary && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {news.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">{news.source}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(news.publishedAt)}</span>
            </div>
            {news.relatedTickers && news.relatedTickers.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {news.relatedTickers.slice(0, 3).join(', ')}
                  {news.relatedTickers.length > 3 && '...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {news.url && (
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open article"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </article>
  )
}

export function MarketNews({ 
  category = 'general', 
  maxItems = 10,
  className 
}: MarketNewsProps) {
  const { data: news, isLoading, error, isFetching } = useNews({
    category,
    refetchInterval: 2.5 * 60 * 1000, // Poll every 2.5 minutes
  })

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">
          Failed to load news. Please try again later.
        </p>
      </div>
    )
  }

  if (!news || news.length === 0) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">No news available.</p>
      </div>
    )
  }

  const displayNews = news.slice(0, maxItems)

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Market News</h2>
        {isFetching && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        {displayNews.map((item: MarketNews) => (
          <NewsItem key={item.id} news={item} />
        ))}
      </div>

      {news.length > maxItems && (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
          Showing {maxItems} of {news.length} articles
        </div>
      )}
    </div>
  )
}

