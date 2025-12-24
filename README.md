# TradeView - Mini Financial Dashboard 📊

A full-stack financial dashboard built with React, TypeScript, Node.js, and real-time WebSocket data streaming. Inspired by TradingView's design aesthetic.

![Dashboard Preview](https://via.placeholder.com/800x400?text=TradeView+Dashboard)

## ✨ Features

- **Real-time Stock Tickers** - Live updates via WebSocket
- **Cryptocurrency Tracking** - BTC, ETH, SOL, and more
- **Currency Exchange Rates** - Live forex rates with converter
- **TradingView-style Charts** - Candlestick, line, and area charts
- **Custom Watchlists** - Add/remove your favorite assets
- **Market Overview** - Index prices, sector performance
- **User Authentication** - Secure signup/login with Lucia
- **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: tRPC + React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Lightweight Charts (TradingView)
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js + TypeScript
- **API**: tRPC + Express
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Lucia
- **WebSocket**: ws
- **External APIs**: Polygon.io, CryptoCompare, Open Exchange Rates

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── ui/        # Base UI components (shadcn)
│   │   │   ├── charts/    # Chart components
│   │   │   ├── widgets/   # Dashboard widgets
│   │   │   ├── layout/    # Layout components
│   │   │   └── forms/     # Form components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities
│   │   ├── types/         # TypeScript types
│   │   └── pages/         # Page components
│   └── ...
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── trpc/          # tRPC routers
│   │   ├── websocket/     # WebSocket handlers
│   │   ├── auth/          # Authentication
│   │   ├── db/            # Database schema
│   │   ├── services/      # External API services
│   │   ├── config/        # Configuration
│   │   └── types/         # TypeScript types
│   └── ...
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for PostgreSQL)

### 1. Clone & Install

```bash
cd 18_12_25

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment Variables

#### Server (.env)
```bash
cd server
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=3001
NODE_ENV=development

# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Generate a secure secret (at least 32 characters)
JWT_SECRET=your-super-secret-key-here

# API Keys (get from respective services)
POLYGON_API_KEY=your_polygon_api_key
CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key
OPENEXCHANGERATES_APP_ID=your_openexchangerates_app_id
FINNHUB_API_KEY=your_finnhub_api_key  # Optional: For stock quotes via REST API (polling every 1 minute, 60 requests/min limit on free tier)

# CORS
CLIENT_URL=http://localhost:5173
```

### 3. Setup Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to **Settings → Database**
4. Copy the connection string
5. Run database migrations:

```bash
cd server
npm run db:push
```

### 4. Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Polygon.io | https://polygon.io/dashboard/signup | 5 API calls/minute |
| CryptoCompare | https://www.cryptocompare.com/cryptopian/api-keys | 100K calls/month |
| Open Exchange Rates | https://openexchangerates.org/signup/free | 1K calls/month |

### 5. Start Development Servers

Terminal 1 - Server:
```bash
cd server
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm run dev
```

Open http://localhost:5173 in your browser!

## 📦 Scripts

### Client
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Server
```bash
npm run dev         # Start development server
npm run build       # Build TypeScript
npm run start       # Start production server
npm run db:push     # Push schema to database
npm run db:studio   # Open Drizzle Studio
```

## 🗃️ Database Schema

```sql
-- Users table
users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hashed_password TEXT NOT NULL,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Sessions table
sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

-- User preferences table
user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  watchlist_stocks JSONB DEFAULT '[]',
  watchlist_crypto JSONB DEFAULT '[]',
  favorite_currencies JSONB DEFAULT '[]',
  dashboard_layout JSONB DEFAULT '[]',
  theme VARCHAR(10) DEFAULT 'dark',
  currency VARCHAR(3) DEFAULT 'USD'
)
```

## 🔌 WebSocket Events

### Subscribe
```json
{
  "type": "subscribe",
  "payload": {
    "channel": "stocks",
    "symbols": ["AAPL", "GOOGL", "MSFT"]
  }
}
```

### Receive Updates
```json
{
  "type": "stock-update",
  "payload": {
    "symbol": "AAPL",
    "price": 178.52,
    "change": 2.34,
    "changePercent": 1.33
  },
  "timestamp": 1702912345678
}
```

## 🎨 Design System

The UI is inspired by TradingView with a dark theme:

- **Background**: `#131722`
- **Card**: `#1e222d`
- **Primary**: `#2196f3`
- **Bullish (Green)**: `#26a69a`
- **Bearish (Red)**: `#ef5350`
- **Font**: JetBrains Mono

## 📝 API Endpoints

### tRPC Routes
- `auth.signup` - Create new user
- `auth.login` - Login user
- `auth.logout` - Logout user
- `auth.me` - Get current user
- `stocks.getQuote` - Get stock quote
- `stocks.getQuotes` - Get multiple quotes
- `crypto.getPrice` - Get crypto price
- `crypto.getPrices` - Get multiple prices
- `currencies.getRates` - Get exchange rates
- `currencies.convert` - Convert currency
- `preferences.get` - Get user preferences
- `preferences.update` - Update preferences

## 🔒 Security

- Passwords hashed with SHA-256
- Session-based authentication with Lucia
- HTTP-only cookies for session tokens
- CORS configured for specific origins
- Environment variables for secrets

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ by TradeView Team

