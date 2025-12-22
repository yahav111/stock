# Chart Service Architecture

## Overview

Unified chart service that supports both **stocks** and **cryptocurrencies** without the frontend needing to know which is which.

## Architecture Pattern: Adapter Pattern

```
Frontend Request
    ↓
GET /api/chart?symbol=BTC&range=1D
    ↓
Chart Controller
    ↓
Chart Service (Orchestrator)
    ↓
Symbol Detector → 'crypto' or 'stock'
    ↓
Provider Selection
    ├─ Stock Provider (Polygon.io)
    └─ Crypto Provider (CryptoCompare)
    ↓
Unified Response (HistoricalBar[])
```

## File Structure

```
services/chart/
├── symbol-detector.ts          # Detects crypto vs stock
├── types.ts                     # Unified types
├── chart.service.ts             # Central orchestrator
└── providers/
    ├── chart-provider.interface.ts  # Common interface
    ├── stock-chart-provider.ts      # Polygon adapter
    └── crypto-chart-provider.ts     # CryptoCompare adapter
```

## Key Components

### 1. Symbol Detector
- **Static list** of 10 supported cryptos: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, DOT, MATIC
- Everything else is treated as a stock
- Frontend doesn't need to know

### 2. Chart Service (Orchestrator)
- Decides which provider to use
- Returns unified data structure
- Handles errors gracefully

### 3. Providers (Adapters)
- **Stock Provider**: Uses existing Polygon.io service
- **Crypto Provider**: Uses CryptoCompare `/data/v2/histoday` endpoint
- Both implement `IChartProvider` interface
- Return same data structure: `HistoricalBar[]`

## Unified Data Structure

```typescript
interface HistoricalBar {
  time: number;      // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

## API Endpoint

```
GET /api/chart?symbol=XXX&range=1D
```

**Parameters:**
- `symbol` (required): Stock or crypto symbol (e.g., "AAPL", "BTC")
- `range` (optional): "1D" | "1W" | "1M" (default: "1D")

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "type": "crypto",
    "bars": [
      {
        "time": 1703001600,
        "open": 43500,
        "high": 44000,
        "low": 43000,
        "close": 43800,
        "volume": 1234567890
      }
    ],
    "name": "Bitcoin"
  }
}
```

## Design Decisions

### 1. **Backend Decision Making**
- Frontend sends symbol, backend decides if crypto or stock
- Keeps frontend simple and agnostic

### 2. **Adapter Pattern**
- Each provider implements same interface
- Easy to add new providers (forex, commodities, etc.)
- Testable in isolation

### 3. **Unified Data Format**
- Same structure for all asset types
- Frontend chart component works with any asset
- No conditional logic needed

### 4. **Static Crypto List**
- Simple and fast detection
- No API calls needed to determine type
- Can be extended later

### 5. **Caching**
- Both providers cache historical data
- Reduces API calls
- Improves performance

## Adding New Providers

1. Create new provider class implementing `IChartProvider`
2. Add to `ChartService.providers` array
3. Update `SymbolDetector` if needed
4. Done! Frontend doesn't need changes

## Error Handling

- If provider fails, returns mock data (development)
- Logs errors for debugging
- Graceful degradation

