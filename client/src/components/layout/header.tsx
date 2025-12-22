import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  TrendingUp,
  Bell,
  Search,
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { useAuthStore } from "../../stores/auth-store"
import { useDashboardStore } from "../../stores/dashboard-store"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isConnected } = useDashboardStore()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">TradeView</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            to="/dashboard"
            className="transition-colors hover:text-foreground text-muted-foreground"
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/stocks"
            className="transition-colors hover:text-foreground text-muted-foreground"
          >
            Stocks
          </Link>
          <Link
            to="/dashboard/crypto"
            className="transition-colors hover:text-foreground text-muted-foreground"
          >
            Crypto
          </Link>
          <Link
            to="/dashboard/currencies"
            className="transition-colors hover:text-foreground text-muted-foreground"
          >
            Currencies
          </Link>
        </nav>

        {/* Search */}
        <div className="flex-1 mx-4">
          {searchOpen ? (
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbols, stocks, crypto..."
                className="pl-9 pr-9"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchOpen(false)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">
                ⌘K
              </kbd>
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <Badge
            variant={isConnected ? "bullish" : "secondary"}
            className="hidden sm:flex gap-1 items-center"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-bullish" : "bg-muted-foreground"}`} />
            {isConnected ? "Live" : "Offline"}
          </Badge>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {isAuthenticated ? (
            <>
              {/* Settings */}
              <Link to="/dashboard/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>

              {/* User menu */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm">{user?.name || user?.email}</span>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border p-4 space-y-4 bg-background">
          <nav className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
          {!isAuthenticated && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button className="w-full">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
