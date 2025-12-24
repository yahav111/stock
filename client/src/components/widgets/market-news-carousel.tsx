/**
 * Market News Carousel Widget
 * Displays market news in a carousel format with "Load More" pagination
 */
import { useState, useRef, useEffect } from "react"
import { useNews, useLoadMoreNews } from "../../hooks/api"
import { Loader2, ChevronLeft, ChevronRight, ExternalLink, Clock, ArrowDown } from "lucide-react"
import { cn } from "../../lib/utils"
import type { MarketNews } from "../../types"

interface MarketNewsCarouselProps {
  category?: 'general' | 'forex' | 'crypto' | 'merger'
  itemsPerPage?: number
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

// Placeholder image service - you can replace with your own
function getNewsImage(news: MarketNews): string {
  if (news.image) return news.image
  
  // Use a placeholder service or generate based on source
  // Option 1: Use placeholder.com
  return `https://via.placeholder.com/400x250/1a1a1a/ffffff?text=${encodeURIComponent(news.source)}`
  
  // Option 2: Use unsplash source (if you want random images)
  // return `https://source.unsplash.com/400x250/?finance,business`
}

function NewsCard({ news, className }: { news: MarketNews; className?: string }) {
  return (
    <article className={cn("group relative flex-shrink-0 w-full md:w-[400px] bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all", className)}>
      {/* Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <img
          src={getNewsImage(news)}
          alt={news.headline}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to placeholder on error
            e.currentTarget.src = `https://via.placeholder.com/400x250/1a1a1a/ffffff?text=${encodeURIComponent(news.source)}`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Source badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
            {news.source}
          </span>
        </div>

        {/* External link icon */}
        {news.url && (
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors"
            aria-label="Open article"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {news.headline}
        </h3>
        
        {news.summary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {news.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
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
    </article>
  )
}

export function MarketNewsCarousel({ 
  category = 'general', 
  itemsPerPage = 5,
  className 
}: MarketNewsCarouselProps) {
  const [allNews, setAllNews] = useState<MarketNews[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const { data: initialNews, isLoading, error, isFetching } = useNews({
    category,
    refetchInterval: 2.5 * 60 * 1000, // Poll every 2.5 minutes
  })

  const loadMoreNews = useLoadMoreNews()

  // Initialize with first batch of news and update when new news arrives
  useEffect(() => {
    if (initialNews && initialNews.length > 0) {
      // If we already have news, merge and deduplicate (for dynamic updates)
      if (allNews.length > 0) {
        const existingIds = new Set(allNews.map(n => n.id))
        const newNews = initialNews.filter(n => !existingIds.has(n.id))
        
        // Only add truly new news to the beginning (newest first)
        if (newNews.length > 0) {
          setAllNews(prev => [...newNews, ...prev])
        }
      } else {
        // First load - set initial news
        setAllNews(initialNews)
      }
      
      // Check if there's more to load (if we got full page, likely more exists)
      setHasMore(initialNews.length >= itemsPerPage)
    }
  }, [initialNews, itemsPerPage, allNews.length])

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || allNews.length === 0) return

    setIsLoadingMore(true)
    try {
      // Get the oldest news ID (last item in array = oldest)
      // Finnhub IDs are numeric, lower = older
      const oldestNews = allNews[allNews.length - 1]
      const oldestId = parseInt(oldestNews.id, 10)
      
      if (isNaN(oldestId)) {
        console.warn('Cannot load more: invalid news ID format')
        setHasMore(false)
        return
      }
      
      // Load older news (news with ID < oldestId)
      const olderNews = await loadMoreNews(category, oldestId)
      
      if (olderNews.length === 0) {
        setHasMore(false)
      } else {
        // Append to end (maintain chronological order - newest first, oldest last)
        // Deduplicate by ID to avoid duplicates
        const existingIds = new Set(allNews.map(n => n.id))
        const newNews = olderNews.filter(n => !existingIds.has(n.id))
        
        if (newNews.length === 0) {
          setHasMore(false)
        } else {
          setAllNews(prev => [...prev, ...newNews])
          // If we got less than itemsPerPage, likely no more to load
          if (newNews.length < itemsPerPage) {
            setHasMore(false)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load more news:', error)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const cardWidth = 400 + 24 // card width + gap
    const scrollAmount = cardWidth * 2 // Scroll 2 cards at a time

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      setCurrentIndex(prev => Math.max(0, prev - 2))
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setCurrentIndex(prev => Math.min(allNews.length - 1, prev + 2))
    }
  }

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

  if (!allNews || allNews.length === 0) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">No news available.</p>
      </div>
    )
  }

  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < allNews.length - itemsPerPage

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Market News</h2>
        {isFetching && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:bg-background transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto px-4 py-6 scroll-smooth hide-scrollbar"
        >
          {allNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:bg-background transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 border-t border-border text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-accent hover:bg-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                Load More News
              </>
            )}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="px-4 pb-4 text-center text-xs text-muted-foreground">
        Showing {allNews.length} articles
      </div>
    </div>
  )
}

