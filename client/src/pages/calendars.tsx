/**
 * Calendars Page
 * Full page view for Economic, Earnings, and IPO calendars
 */
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { EconomicCalendar } from "../components/widgets/economic-calendar";

export function CalendarsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Economic Calendars</h1>
              <p className="text-sm text-muted-foreground">
                Track upcoming economic events, earnings reports, and IPO listings
              </p>
            </div>

            {/* Calendar Component */}
            <EconomicCalendar />
          </div>
        </main>
      </div>
    </div>
  );
}

