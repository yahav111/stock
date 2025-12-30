/**
 * Upcoming Events Preview Widget
 * Compact widget showing upcoming events for dashboard
 */
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Clock, MapPin, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useUpcomingEvents } from "../../hooks/api";
import type { EconomicEvent, EarningsEvent, IPOEvent } from "../../types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EconomicEventItem({ event }: { event: EconomicEvent }) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">{formatDate(event.date)}</span>
          <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getImpactColor(event.impact))}>
            {event.impact}
          </Badge>
        </div>
        <p className="text-sm font-medium truncate">{event.event}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {event.country}
          </div>
          {event.time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {event.time}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EarningsEventItem({ event }: { event: EarningsEvent }) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">{formatDate(event.date)}</span>
          <span className="text-xs font-mono font-semibold text-primary">{event.symbol}</span>
        </div>
        <p className="text-sm font-medium truncate">{event.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {event.time === 'bmo' ? 'Before Market' : event.time === 'amc' ? 'After Market' : 'TBD'}
          </span>
          {event.epsEstimate && (
            <span className="text-xs text-muted-foreground">
              EPS Est: {event.epsEstimate.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function IPOEventItem({ event }: { event: IPOEvent }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'priced':
        return 'bg-green-500/20 text-green-400';
      case 'withdrawn':
        return 'bg-red-500/20 text-red-400';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">{formatDate(event.date)}</span>
          <span className="text-xs font-mono font-semibold text-primary">{event.symbol}</span>
          <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getStatusColor(event.status))}>
            {event.status}
          </Badge>
        </div>
        <p className="text-sm font-medium truncate">{event.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{event.exchange}</span>
          {event.price && (
            <span className="text-xs font-mono text-muted-foreground">
              ${event.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpcomingEventsPreview() {
  const { economic, earnings, ipo, isLoading, isError } = useUpcomingEvents({ limit: 3 });

  const totalEvents = (economic.data?.length || 0) + (earnings.data?.length || 0) + (ipo.data?.length || 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Events
          </CardTitle>
          <Link
            to="/dashboard/calendars"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Failed to load events
            </p>
          </div>
        ) : totalEvents === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {/* Economic Events */}
            {economic.data && economic.data.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Economic
                </div>
                {economic.data.map((event) => (
                  <EconomicEventItem key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Earnings Events */}
            {earnings.data && earnings.data.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Earnings
                </div>
                {earnings.data.map((event) => (
                  <EarningsEventItem key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* IPO Events */}
            {ipo.data && ipo.data.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  IPO
                </div>
                {ipo.data.map((event) => (
                  <IPOEventItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

