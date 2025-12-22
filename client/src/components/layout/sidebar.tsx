import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  TrendingUp,
  Bitcoin,
  ArrowRightLeft,
  Star,
  Settings,
  FileText,
  PlusCircle,
  ChevronDown,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { useDashboardStore } from "../../stores/dashboard-store"

interface NavItemProps {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

function NavItem({ icon: Icon, label, href, badge }: NavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === href

  return (
    <Link to={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        {badge !== undefined && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-muted">{badge}</span>
        )}
      </div>
    </Link>
  )
}

export function Sidebar() {
  const { watchlistStocks, watchlistCrypto } = useDashboardStore()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50">
      <div className="flex-1 py-4 overflow-y-auto">
        {/* Main navigation */}
        <div className="px-3 mb-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overview
          </h3>
          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
            <NavItem icon={TrendingUp} label="Stocks" href="/dashboard/stocks" />
            <NavItem icon={Bitcoin} label="Crypto" href="/dashboard/crypto" />
            <NavItem icon={ArrowRightLeft} label="Currencies" href="/dashboard/currencies" />
          </nav>
        </div>

        {/* Watchlist */}
        <div className="px-3 mb-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Watchlist</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <PlusCircle className="h-3 w-3" />
            </Button>
          </h3>
          <nav className="space-y-1">
            <NavItem
              icon={Star}
              label="Stocks"
              href="/dashboard/watchlist/stocks"
              badge={watchlistStocks.length}
            />
            <NavItem
              icon={Star}
              label="Crypto"
              href="/dashboard/watchlist/crypto"
              badge={watchlistCrypto.length}
            />
          </nav>
        </div>

        {/* Quick stocks */}
        <div className="px-3 mb-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Quick Access</span>
            <ChevronDown className="h-3 w-3" />
          </h3>
          <nav className="space-y-1">
            {watchlistStocks.slice(0, 5).map((symbol) => (
              <Link key={symbol} to={`/dashboard/stocks/${symbol}`}>
                <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <span className="font-mono">{symbol}</span>
                  <span className="text-xs text-bullish">+1.23%</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Tools */}
        <div className="px-3">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tools
          </h3>
          <nav className="space-y-1">
            <NavItem icon={FileText} label="Documents" href="/dashboard/documents" />
            <NavItem icon={Settings} label="Settings" href="/dashboard/settings" />
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>Market data provided by</p>
          <p className="font-semibold text-foreground">Polygon.io & CryptoCompare</p>
        </div>
      </div>
    </aside>
  )
}

