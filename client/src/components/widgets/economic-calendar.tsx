/**
 * Economic Calendar Component
 * Displays economic events in a TradingView-inspired table
 */
import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useEconomicCalendar, useEarningsCalendar, useIPOCalendar } from "../../hooks/api";
import type { EconomicEvent, EarningsEvent, IPOEvent } from "../../types";

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return 'TBD';
  return timeStr;
}

// Economic Calendar Table
function EconomicCalendarTable({ events }: { events: EconomicEvent[] }) {
  const [filter, setFilter] = useState({ country: '', impact: '' as 'high' | 'medium' | 'low' | '' });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filter.country && !event.country.toLowerCase().includes(filter.country.toLowerCase())) {
        return false;
      }
      if (filter.impact && event.impact !== filter.impact) {
        return false;
      }
      return true;
    });
  }, [events, filter]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter by country..."
          value={filter.country}
          onChange={(e) => setFilter({ ...filter, country: e.target.value })}
          className="max-w-xs"
        />
        <select
          value={filter.impact}
          onChange={(e) => setFilter({ ...filter, impact: e.target.value as any })}
          className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
        >
          <option value="">All Impact</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No events scheduled for the selected period.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const actualVsEstimate = event.actual !== undefined && event.estimate !== undefined
                    ? event.actual - event.estimate
                    : null;
                  const Icon = actualVsEstimate !== null
                    ? actualVsEstimate > 0 ? TrendingUp : actualVsEstimate < 0 ? TrendingDown : Minus
                    : null;

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-accent/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-sm font-mono">{formatDate(event.date)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.time)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{event.event}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {event.country}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs", getImpactColor(event.impact))}>
                          {event.impact.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {event.estimate?.toFixed(2) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-1">
                          {event.actual?.toFixed(2) || '-'}
                          {Icon && (
                            <Icon className={cn(
                              "w-3 h-3",
                              actualVsEstimate! > 0 ? "text-bullish" : actualVsEstimate! < 0 ? "text-bearish" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {event.previous?.toFixed(2) || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Earnings Calendar Table
function EarningsCalendarTable({ events }: { events: EarningsEvent[] }) {
  const [filter, setFilter] = useState({ symbol: '' });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filter.symbol && !event.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) &&
          !event.name.toLowerCase().includes(filter.symbol.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [events, filter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter by symbol or company..."
          value={filter.symbol}
          onChange={(e) => setFilter({ ...filter, symbol: e.target.value })}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">EPS Estimate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">EPS Actual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Est.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No events scheduled for the selected period.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const epsBeat = event.epsActual !== undefined && event.epsEstimate !== undefined
                    ? event.epsActual > event.epsEstimate
                    : null;
                  const revenueBeat = event.revenueActual !== undefined && event.revenueEstimate !== undefined
                    ? event.revenueActual > event.revenueEstimate
                    : null;

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-accent/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-sm font-mono">{formatDate(event.date)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          event.time === 'bmo' ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                          event.time === 'amc' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                          "bg-muted text-muted-foreground border border-border"
                        )}>
                          {event.time === 'bmo' ? 'Before Market' : event.time === 'amc' ? 'After Market' : 'TBD'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{event.symbol}</td>
                      <td className="px-4 py-3 text-sm">{event.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {event.epsEstimate?.toFixed(2) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-1">
                          {event.epsActual?.toFixed(2) || '-'}
                          {epsBeat !== null && (
                            epsBeat ? (
                              <TrendingUp className="w-3 h-3 text-bullish" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-bearish" />
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {event.revenueEstimate ? `$${(event.revenueEstimate / 1000000).toFixed(1)}M` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-1">
                          {event.revenueActual ? `$${(event.revenueActual / 1000000).toFixed(1)}M` : '-'}
                          {revenueBeat !== null && (
                            revenueBeat ? (
                              <TrendingUp className="w-3 h-3 text-bullish" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-bearish" />
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// IPO Calendar Table
function IPOCalendarTable({ events }: { events: IPOEvent[] }) {
  const [filter, setFilter] = useState({ symbol: '', exchange: '' });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filter.symbol && !event.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) &&
          !event.name.toLowerCase().includes(filter.symbol.toLowerCase())) {
        return false;
      }
      if (filter.exchange && !event.exchange.toLowerCase().includes(filter.exchange.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [events, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'priced':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'withdrawn':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter by symbol or company..."
          value={filter.symbol}
          onChange={(e) => setFilter({ ...filter, symbol: e.target.value })}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by exchange..."
          value={filter.exchange}
          onChange={(e) => setFilter({ ...filter, exchange: e.target.value })}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exchange</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shares</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No events scheduled for the selected period.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-accent/50 transition-colors group"
                  >
                    <td className="px-4 py-3 text-sm font-mono">{formatDate(event.date)}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{event.symbol}</td>
                    <td className="px-4 py-3 text-sm">{event.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{event.exchange}</td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {event.price ? `$${event.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {event.shares ? `${(event.shares / 1000000).toFixed(1)}M` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {event.totalValue ? `$${(event.totalValue / 1000000).toFixed(1)}M` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(event.status))}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function EconomicCalendar() {
  // Get date ranges
  const today = new Date();
  
  // Economic: next 7 days (FMP requirement)
  const economicFrom = today.toISOString().split('T')[0];
  const economicToDate = new Date(today);
  economicToDate.setDate(economicToDate.getDate() + 7);
  const economicToStr = economicToDate.toISOString().split('T')[0];
  
  // Earnings: next 30 days (Finnhub)
  const earningsTo = new Date(today);
  earningsTo.setDate(earningsTo.getDate() + 30);
  const earningsFrom = today.toISOString().split('T')[0];
  const earningsToStr = earningsTo.toISOString().split('T')[0];
  
  // IPO: next 60 days (FMP requirement)
  const ipoFrom = today.toISOString().split('T')[0];
  const ipoToDate = new Date(today);
  ipoToDate.setDate(ipoToDate.getDate() + 60);
  const ipoToStr = ipoToDate.toISOString().split('T')[0];

  const economic = useEconomicCalendar({ from: economicFrom, to: economicToStr });
  const earnings = useEarningsCalendar({ from: earningsFrom, to: earningsToStr });
  const ipo = useIPOCalendar({ from: ipoFrom, to: ipoToStr });

  const isLoading = economic.isLoading || earnings.isLoading || ipo.isLoading;
  const isError = economic.isError || earnings.isError || ipo.isError;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Economic Calendars
          </CardTitle>
          {(economic.isFetching || earnings.isFetching || ipo.isFetching) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading calendar data...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load calendar data. Please try again later.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="earnings" className="w-full">
            <TabsList className="w-full mb-4">
              {/* Only show Economic tab if there's data */}
              {economic.data && economic.data.length > 0 && (
                <TabsTrigger value="economic" className="flex-1">
                  Economic ({economic.data.length})
                  {economic.isFetching && (
                    <Loader2 className="w-3 h-3 ml-2 animate-spin text-muted-foreground" />
                  )}
                </TabsTrigger>
              )}
              
              {/* Always show Earnings tab */}
              <TabsTrigger value="earnings" className="flex-1">
                Earnings ({earnings.data?.length || 0})
                {earnings.isFetching && (
                  <Loader2 className="w-3 h-3 ml-2 animate-spin text-muted-foreground" />
                )}
              </TabsTrigger>
              
              {/* Only show IPO tab if there's data */}
              {ipo.data && ipo.data.length > 0 && (
                <TabsTrigger value="ipo" className="flex-1">
                  IPO ({ipo.data.length})
                  {ipo.isFetching && (
                    <Loader2 className="w-3 h-3 ml-2 animate-spin text-muted-foreground" />
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Only show Economic tab content if tab is visible */}
            {economic.data && economic.data.length > 0 && (
              <TabsContent value="economic" className="mt-4">
                {economic.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <EconomicCalendarTable events={economic.data} />
                )}
              </TabsContent>
            )}

            <TabsContent value="earnings" className="mt-4">
              {earnings.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : earnings.data && earnings.data.length > 0 ? (
                <EarningsCalendarTable events={earnings.data} />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No events scheduled for the selected period.
                </div>
              )}
            </TabsContent>

            {/* Only show IPO tab content if tab is visible */}
            {ipo.data && ipo.data.length > 0 && (
              <TabsContent value="ipo" className="mt-4">
                {ipo.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <IPOCalendarTable events={ipo.data} />
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

