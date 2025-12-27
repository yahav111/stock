# שאלות ראיונות טכניות - TradeView Project

## 📋 תוכן עניינים
1. [שאלות כלליות על הארכיטקטורה](#1-שאלות-כלליות-על-הארכיטקטורה)
2. [שאלות Frontend (React/TypeScript)](#2-שאלות-frontend-reacttypescript)
3. [שאלות Backend (Node.js/Express)](#3-שאלות-backend-nodejsexpress)
4. [שאלות Database & ORM](#4-שאלות-database--orm)
5. [שאלות Authentication & Security](#5-שאלות-authentication--security)
6. [שאלות WebSocket & Real-time](#6-שאלות-websocket--real-time)
7. [שאלות State Management](#7-שאלות-state-management)
8. [שאלות ביצועים ואופטימיזציה](#8-שאלות-ביצועים-ואופטימיזציה)

---

## 1. שאלות כלליות על הארכיטקטורה

### שאלה 1.1: תאר את הארכיטקטורה הכללית של הפרויקט
**תשובה:**
הפרויקט הוא Full-Stack Application עם הפרדה ברורה בין Client ו-Server:

**Frontend (Client):**
- React 19 עם TypeScript
- Vite כבנייה
- React Router לניווט
- Zustand לניהול state
- React Query לניהול data fetching ו-caching
- WebSocket client לעדכונים בזמן אמת
- Tailwind CSS לעיצוב

**Backend (Server):**
- Node.js + Express
- TypeScript
- PostgreSQL עם Drizzle ORM
- Lucia Auth לאימות
- WebSocket Server (ws) לעדכונים בזמן אמת
- REST API עם מבנה Controller-Service-Route

**תקשורת:**
- REST API דרך Axios עם interceptors
- WebSocket לעדכונים בזמן אמת של מחירים
- Session-based authentication עם cookies + Bearer tokens

---

### שאלה 1.2: למה בחרת להפריד את הפרויקט ל-Client ו-Server נפרדים?
**תשובה:**
1. **Scalability** - אפשר להריץ כל חלק על שרתים נפרדים
2. **Team Collaboration** - צוותים שונים יכולים לעבוד במקביל
3. **Technology Flexibility** - אפשר לשנות טכנולוגיות בכל צד בנפרד
4. **Security** - השרת לא חושף קוד עסקי ללקוח
5. **Caching & CDN** - אפשר לשרת את ה-Client מ-CDN
6. **API Reusability** - אותו API יכול לשמש אפליקציות שונות (web, mobile)

---

## 2. שאלות Frontend (React/TypeScript)

### שאלה 2.1: איך אתה מנהל state באפליקציה? למה בחרת ב-Zustand?
**תשובה:**
אני משתמש ב-**Zustand** לניהול state גלובלי (auth, websocket, dashboard) ו-**React Query** לניהול server state.

**Zustand - למה:**
1. **קל ופשוט** - פחות boilerplate מ-Redux
2. **TypeScript support מעולה** - type safety מלא
3. **Persist middleware** - שמירה אוטומטית ל-localStorage
4. **Performance** - רק components שמשתמשים ב-state מתעדכנים
5. **קל לבדיקה** - hooks פשוטים לבדיקות

**דוגמה מהקוד:**
```typescript
// auth-store.ts - עם persist middleware
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      // ...
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

**React Query** - לניהול server state:
- Caching אוטומטי
- Background refetching
- Optimistic updates
- Error handling מובנה

---

### שאלה 2.2: איך אתה מטפל ב-error handling ב-frontend?
**תשובה:**
יש לי מספר שכבות של error handling:

**1. API Client Interceptors** (`client.ts`):
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    // 401 - Unauthorized
    if (status === 401) {
      // Clear auth state
      // Redirect to home
    }
    
    // 429 - Rate limited
    if (status === 429) {
      console.warn('Rate limited, please wait');
    }
    
    // 500+ - Server error
    if (status >= 500) {
      console.error('Server error');
    }
    
    // Network errors
    if (!error.response) {
      console.error('Cannot connect to server');
    }
    
    return Promise.reject(error);
  }
);
```

**2. React Query Error Handling:**
- React Query מטפל אוטומטית ב-retries
- אפשר להגדיר `onError` callbacks
- Error states זמינים דרך `isError` ו-`error`

**3. Helper Functions:**
```typescript
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data.error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

---

### שאלה 2.3: איך אתה מנהל authentication ב-frontend?
**תשובה:**
**1. Auth Store (Zustand) עם Persist:**
- שמירת user, token, isAuthenticated ב-localStorage
- Auto-persist בין reloads

**2. API Client Interceptor:**
- הוספת Bearer token לכל request
- טיפול ב-401 errors (logout + redirect)

**3. Protected Routes:**
- בדיקת `isAuthenticated` לפני גישה ל-routes מוגנים
- Redirect ל-login אם לא מאומת

**4. Token Management:**
```typescript
// Request interceptor
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  const authData = JSON.parse(authStorage);
  const token = authData?.state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

---

### שאלה 2.4: איך אתה משתמש ב-React Query? תן דוגמה
**תשובה:**
**הגדרת QueryClient:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**דוגמה - Portfolio Hook:**
```typescript
export function usePortfolio() {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: portfolioApi.getPortfolio,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

// Mutation עם cache invalidation
export function useAddPortfolioEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params) => portfolioApi.addPortfolioEntry(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}
```

**יתרונות:**
- Caching אוטומטי
- Background refetching
- Loading/error states מובנים
- Cache invalidation אחרי mutations

---

## 3. שאלות Backend (Node.js/Express)

### שאלה 3.1: תאר את מבנה ה-API - איך אתה מארגן routes, controllers, services?
**תשובה:**
יש לי מבנה **Layered Architecture**:

**1. Routes** (`/api/routes/`):
- מגדירים את ה-endpoints
- Middleware (auth, validation)
- קוראים ל-controllers

```typescript
router.get('/', requireAuth, asyncHandler(controller.getPortfolio));
router.post('/', requireAuth, validate({ body: validators.addPortfolioBody }), 
  asyncHandler(controller.addPortfolioEntry));
```

**2. Controllers** (`/api/controllers/`):
- מטפלים ב-HTTP requests/responses
- Extract data מה-request
- קוראים ל-services
- מחזירים responses מובנים

```typescript
export async function getPortfolio(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.id;
  const entries = await portfolioService.getUserPortfolio(userId);
  res.status(HttpStatus.OK).json(successResponse({ entries }));
}
```

**3. Services** (`/services/`):
- Business logic
- Database operations
- External API calls
- לא תלויים ב-HTTP

```typescript
export async function getUserPortfolio(userId: string): Promise<PortfolioEntry[]> {
  await updatePortfolioPrices(userId);
  const entries = await db.select().from(portfolio).where(eq(portfolio.userId, userId));
  return entries.map(/* transform */);
}
```

**יתרונות:**
- Separation of concerns
- קל לבדיקה (services בלי HTTP)
- Reusability (services יכולים לשמש במקומות שונים)

---

### שאלה 3.2: איך אתה מטפל ב-error handling ב-backend?
**תשובה:**
**1. Custom Error Class** (`ApiError`):
```typescript
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  
  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }
}
```

**2. Async Handler Wrapper:**
```typescript
export function asyncHandler(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

**3. Global Error Handler:**
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  
  // Unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});
```

**4. Structured Response Format:**
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: "...", message: "..." } }
```

---

### שאלה 3.3: איך אתה מטפל ב-validation?
**תשובה:**
אני משתמש ב-**Zod** ל-validation:

**1. Validators** (`/api/validators/`):
```typescript
export const addPortfolioBody = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  shares: z.number().positive(),
  averagePrice: z.number().positive(),
});
```

**2. Validation Middleware:**
```typescript
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = addPortfolioBody.parse(req.body);
      }
      if (schemas.params) {
        req.params = getPortfolioParams.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ApiError.validation(error.errors);
      }
      throw error;
    }
  };
}
```

**3. Usage:**
```typescript
router.post(
  '/',
  validate({ body: validators.addPortfolioBody }),
  asyncHandler(controller.addPortfolioEntry)
);
```

**יתרונות:**
- Type-safe (TypeScript inference)
- Runtime validation
- הודעות שגיאה ברורות
- Reusable schemas

---

## 4. שאלות Database & ORM

### שאלה 4.1: למה בחרת ב-Drizzle ORM ולא ב-TypeORM או Prisma?
**תשובה:**
**Drizzle ORM - יתרונות:**
1. **TypeScript-first** - type safety מלא, inference מעולה
2. **קל ומינימלי** - פחות magic, יותר שליטה
3. **Performance** - SQL queries יעילים, לא over-engineered
4. **SQL-like syntax** - קל להבין מה קורה
5. **Schema migrations** - Drizzle Kit לניהול migrations
6. **קל לבדיקה** - queries פשוטים לבדיקה

**דוגמה:**
```typescript
// Schema definition
export const portfolio = pgTable('portfolio', {
  userId: text('user_id').notNull().references(() => users.id),
  symbol: text('symbol').notNull(),
  shares: numeric('shares', { precision: 15, scale: 4 }).notNull(),
  // ...
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.symbol] }),
}));

// Query
const entries = await db
  .select()
  .from(portfolio)
  .where(eq(portfolio.userId, userId));
```

**vs TypeORM/Prisma:**
- TypeORM - יותר כבד, יותר magic, פחות type-safe
- Prisma - טוב אבל יותר כבד, migration system מורכב יותר

---

### שאלה 4.2: איך אתה מגדיר relationships ב-Drizzle?
**תשובה:**
**1. Foreign Keys:**
```typescript
export const portfolio = pgTable('portfolio', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // ...
});
```

**2. Composite Primary Key:**
```typescript
(table) => ({
  pk: primaryKey({ columns: [table.userId, table.symbol] }),
})
```

**3. Queries עם Joins:**
```typescript
import { eq } from 'drizzle-orm';

const result = await db
  .select({
    portfolio: portfolio,
    user: users,
  })
  .from(portfolio)
  .innerJoin(users, eq(portfolio.userId, users.id))
  .where(eq(portfolio.userId, userId));
```

---

### שאלה 4.3: איך אתה מנהל migrations?
**תשובה:**
**1. Drizzle Kit:**
```json
// package.json
"scripts": {
  "db:generate": "drizzle-kit generate:pg",
  "db:migrate": "drizzle-kit up:pg",
  "db:push": "drizzle-kit push:pg",
  "db:studio": "drizzle-kit studio"
}
```

**2. Process:**
- שינוי schema ב-TypeScript
- `npm run db:generate` - יוצר migration files
- `npm run db:migrate` - מריץ migrations
- או `db:push` ל-development (auto-sync)

**3. Migration Files:**
```sql
-- drizzle/migrations/0001_add_portfolio_table.sql
CREATE TABLE IF NOT EXISTS "portfolio" (
  "user_id" text NOT NULL,
  "symbol" text NOT NULL,
  "shares" numeric(15,4) NOT NULL,
  -- ...
  PRIMARY KEY("user_id","symbol")
);
```

---

## 5. שאלות Authentication & Security

### שאלה 5.1: איך אתה מטפל ב-authentication? למה Lucia?
**תשובה:**
אני משתמש ב-**Lucia Auth** - ספרייה מודרנית ו-secure ל-session management.

**למה Lucia:**
1. **Type-safe** - TypeScript support מעולה
2. **Framework-agnostic** - עובד עם כל framework
3. **Database adapter** - תמיכה ב-Drizzle (ואחרים)
4. **Session-based** - secure cookies, לא JWT ב-localStorage
5. **קל לשימוש** - API פשוט

**Implementation:**
```typescript
// Setup
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
  },
});

// Login
const session = await lucia.createSession(userId, {});
const sessionCookie = lucia.createSessionCookie(session.id);
res.setHeader('Set-Cookie', sessionCookie.serialize());

// Middleware
const { session, user } = await lucia.validateSession(sessionToken);
if (!session || !user) {
  throw ApiError.unauthorized();
}
```

**Security Features:**
- HttpOnly cookies (לא נגיש ל-JavaScript)
- Secure flag ב-production (HTTPS only)
- Session expiration
- CSRF protection דרך sameSite

---

### שאלה 5.2: איך אתה מטפל ב-password hashing?
**תשובה:**
**⚠️ הערה חשובה:** בקוד הנוכחי יש בעיה - אני משתמש ב-SHA-256 בלבד, שזה **לא מספיק secure** ל-passwords!

**הקוד הנוכחי (לא מומלץ):**
```typescript
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // ...
}
```

**מה שצריך לעשות (מומלץ):**
```typescript
import { Argon2id } from 'oslo/password';

export async function hashPassword(password: string): Promise<string> {
  return await new Argon2id().hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await new Argon2id().verify(hash, password);
}
```

**למה Argon2id:**
- **Slow by design** - מקשה על brute force
- **Memory-hard** - מקשה על hardware attacks
- **Industry standard** - מומלץ על ידי OWASP
- **Built-in salt** - לא צריך לנהל salt ידנית

---

### שאלה 5.3: איך אתה מגן על ה-API מפני attacks?
**תשובה:**
**1. Authentication Middleware:**
- כל route מוגן דורש authentication
- Session validation על כל request

**2. Input Validation:**
- Zod validation על כל input
- Type checking
- Sanitization (למשל `.toUpperCase()` ל-symbols)

**3. CORS:**
```typescript
app.use(cors({
  origin: env.CLIENT_URL, // רק origin מורשה
  credentials: true,
}));
```

**4. Rate Limiting:**
- לא מומש כרגע, אבל צריך להוסיף (express-rate-limit)
- חשוב במיוחד ל-external API calls

**5. SQL Injection Protection:**
- Drizzle ORM משתמש ב-parameterized queries
- לא string concatenation

**6. Error Handling:**
- לא חושף מידע רגיש ב-errors
- Generic messages ל-client

**7. Environment Variables:**
- API keys לא בקוד
- `.env` file (לא ב-git)

---

## 6. שאלות WebSocket & Real-time

### שאלה 6.1: תאר את ה-WebSocket implementation - איך זה עובד?
**תשובה:**
**Server Side** (`websocket/index.ts`):

**1. Connection Management:**
```typescript
const clients = new Map<string, Client>();

interface Client {
  id: string;
  socket: WebSocket;
  subscriptions: {
    stocks: Set<string>;
    crypto: Set<string>;
    currencies: Set<string>;
  };
  lastHeartbeat: number;
}
```

**2. Message Handling:**
```typescript
socket.on('message', (data) => {
  const message = JSON.parse(data.toString());
  switch (message.type) {
    case 'subscribe':
      handleSubscribe(client, message.payload);
      break;
    case 'unsubscribe':
      handleUnsubscribe(client, message.payload);
      break;
    case 'heartbeat':
      client.lastHeartbeat = Date.now();
      break;
  }
});
```

**3. Data Polling:**
- Polling stocks כל 2 דקות (Polygon/Finnhub)
- Polling crypto כל 30 שניות
- Polling currencies כל 10 דקות
- Broadcast לכל clients שמנויים

**4. Heartbeat:**
```typescript
function startHeartbeat() {
  setInterval(() => {
    clients.forEach((client) => {
      if (now - client.lastHeartbeat > timeout) {
        client.socket.terminate(); // Disconnect stale clients
      } else {
        sendMessage(client.socket, { type: 'heartbeat' });
      }
    });
  }, WS_CONFIG.heartbeatInterval);
}
```

**Client Side:**
- Zustand store לניהול connection
- Auto-reconnect עם exponential backoff
- Re-subscribe אחרי reconnect

---

### שאלה 6.2: למה בחרת ב-polling ולא ב-WebSocket streaming מ-Polygon/Finnhub?
**תשובה:**
**סיבות:**
1. **Rate Limits** - Polygon/Finnhub מגבילים requests
2. **Cost** - WebSocket streaming עולה יותר כסף
3. **Simplicity** - Polling פשוט יותר לניהול
4. **Reliability** - Polling יותר יציב (לא תלוי ב-connection רציף)
5. **Multiple Clients** - Server יכול לשרת הרבה clients עם polling אחד

**אופטימיזציה:**
- Server עושה polling אחד
- Broadcast לכל clients
- Clients לא צריכים לעשות requests נפרדים

**אם היה צריך real-time יותר:**
- אפשר לעבור ל-WebSocket streaming
- או להשתמש ב-Server-Sent Events (SSE)
- או WebSocket מ-Polygon/Finnhub ישירות

---

### שאלה 6.3: איך אתה מטפל ב-reconnection?
**תשובה:**
**Client Side** (`websocket-store.ts`):

```typescript
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

ws.onclose = () => {
  set({ isConnected: false, isConnecting: false });
  
  const { reconnectAttempts } = get();
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      set({ reconnectAttempts: reconnectAttempts + 1 });
      connect(url); // Retry
    }, RECONNECT_DELAY);
  }
};
```

**Re-subscription:**
```typescript
ws.onopen = () => {
  // Re-subscribe to all previous subscriptions
  const { subscriptions } = get();
  subscriptions.forEach((sub) => {
    ws.send(JSON.stringify({
      type: "subscribe",
      payload: sub,
    }));
  });
};
```

**Server Side:**
- Heartbeat לזיהוי stale connections
- Auto-disconnect clients שלא מגיבים

---

## 7. שאלות State Management

### שאלה 7.1: איך אתה מחליט מתי להשתמש ב-Zustand vs React Query?
**תשובה:**
**Zustand - Client State:**
- Authentication state (user, token)
- UI state (modals, sidebar open/close)
- WebSocket connection state
- Real-time data (dashboard stocks/crypto)
- Form state (אם לא משתמשים ב-react-hook-form)

**React Query - Server State:**
- Data מה-API (portfolio, preferences)
- Caching
- Background refetching
- Optimistic updates
- Loading/error states

**דוגמה:**
```typescript
// Zustand - Real-time WebSocket data
const { stocks, updateStock } = useDashboardStore();

// React Query - API data
const { data: portfolio, isLoading } = usePortfolio();
```

**למה הפרדה:**
- React Query מטפל ב-caching, refetching, synchronization
- Zustand פשוט יותר ל-client-only state
- לא צריך לשלוח WebSocket data דרך React Query

---

### שאלה 7.2: איך אתה מנהל state של WebSocket?
**תשובה:**
**שתי שכבות:**

**1. WebSocket Store** - Connection management:
```typescript
interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  subscriptions: WSSubscription[];
  lastMessage: WSMessage | null;
  error: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  subscribe: (subscription: WSSubscription) => void;
}
```

**2. Dashboard Store** - Actual data:
```typescript
interface DashboardState {
  stocks: Record<string, StockQuote>;
  cryptos: Record<string, CryptoPrice>;
  currencies: Record<string, ExchangeRate>;
  updateStock: (symbol: string, data: StockQuote) => void;
  updateCrypto: (symbol: string, data: CryptoPrice) => void;
}
```

**Flow:**
1. WebSocket Store מקבל message
2. Hook (`useWebSocket`) מטפל ב-message
3. קורא ל-`updateStock`/`updateCrypto` ב-Dashboard Store
4. Components שמשתמשים ב-Dashboard Store מתעדכנים

---

## 8. שאלות ביצועים ואופטימיזציה

### שאלה 8.1: איך אתה מטפל ב-rate limiting של external APIs?
**תשובה:**
**1. Polling Intervals:**
- Stocks: כל 2 דקות (Polygon limit: 5 req/min)
- Crypto: כל 30 שניות (CryptoCompare יותר גמיש)
- Currencies: כל 10 דקות (לא משתנה הרבה)

**2. Fallback Strategy:**
```typescript
// Try Polygon first (efficient - one request for all stocks)
if (env.POLYGON_API_KEY) {
  try {
    quotes = await getPolygonStockQuotes(allSymbols);
  } catch (error) {
    // Fallback to Finnhub
    if (env.FINNHUB_API_KEY) {
      quotes = await getFinnhubStockQuotes(allSymbols);
    }
  }
}
```

**3. Error Handling:**
- Catch errors מ-API calls
- Log warnings
- לא crash את ה-server

**4. מה שצריך להוסיף:**
- Rate limiting middleware (express-rate-limit)
- Request queuing
- Exponential backoff
- API key rotation

---

### שאלה 8.2: איך אתה מטפל ב-caching?
**תשובה:**
**Frontend - React Query:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Per-query caching
export function usePortfolio() {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: portfolioApi.getPortfolio,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch
  });
}
```

**Backend:**
- לא מומש כרגע, אבל אפשר להוסיף:
  - Redis cache ל-external API responses
  - In-memory cache עם TTL
  - Database query caching

**WebSocket:**
- Real-time data לא cached (תמיד fresh)
- אבל אפשר להוסיף cache ל-initial data

---

### שאלה 8.3: איך אתה מטפל ב-performance של database queries?
**תשובה:**
**1. Indexes:**
```typescript
// Composite primary key = index
primaryKey({ columns: [table.userId, table.symbol] })

// Foreign key = index (usually)
.references(() => users.id)
```

**2. Efficient Queries:**
```typescript
// Select only needed columns
const entries = await db
  .select({
    symbol: portfolio.symbol,
    shares: portfolio.shares,
    // ...
  })
  .from(portfolio)
  .where(eq(portfolio.userId, userId));
```

**3. Batch Operations:**
- Update multiple entries ב-loop (אפשר לשפר ל-batch)
- Fetch current prices ב-parallel (Promise.all)

**4. מה שצריך להוסיף:**
- Database indexes על columns נפוצים
- Query optimization (EXPLAIN ANALYZE)
- Connection pooling (כבר יש - postgres max: 10)
- Pagination ל-large datasets

---

### שאלה 8.4: איך אתה מטפל ב-optimistic updates?
**תשובה:**
**React Query - Optimistic Updates:**
```typescript
export function useAddPortfolioEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params) => portfolioApi.addPortfolioEntry(params),
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: portfolioKeys.all });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(portfolioKeys.list());
      
      // Optimistically update
      queryClient.setQueryData(portfolioKeys.list(), (old) => {
        return [...(old || []), newEntry];
      });
      
      return { previous };
    },
    onError: (err, newEntry, context) => {
      // Rollback on error
      queryClient.setQueryData(portfolioKeys.list(), context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}
```

**יתרונות:**
- UI מגיב מיד (לא מחכה ל-server)
- Rollback אוטומטי אם נכשל
- Better UX

---

## שאלות בונוס - Best Practices

### שאלה 9.1: מה היית משפר בפרויקט?
**תשובה:**
1. **Password Hashing** - לעבור ל-Argon2id במקום SHA-256
2. **Rate Limiting** - להוסיף express-rate-limit
3. **Error Logging** - להוסיף Sentry או שירות דומה
4. **Testing** - להוסיף unit tests ו-integration tests
5. **API Documentation** - OpenAPI/Swagger
6. **Database Indexes** - להוסיף indexes על columns נפוצים
7. **Caching** - Redis cache ל-external APIs
8. **Monitoring** - Health checks, metrics
9. **CI/CD** - Automated testing ו-deployment
10. **Type Safety** - יותר strict TypeScript config

---

### שאלה 9.2: איך היית scale את הפרויקט?
**תשובה:**
1. **Horizontal Scaling:**
   - Load balancer (Nginx)
   - Multiple server instances
   - Stateless servers (session ב-Redis)

2. **Database:**
   - Read replicas
   - Connection pooling
   - Query optimization

3. **Caching:**
   - Redis ל-sessions ו-cache
   - CDN ל-static assets

4. **WebSocket:**
   - Redis Pub/Sub ל-multi-server WebSocket
   - או WebSocket server נפרד

5. **Monitoring:**
   - APM (Application Performance Monitoring)
   - Log aggregation
   - Error tracking

---

## סיכום

זהו פרויקט Full-Stack מודרני עם:
- ✅ TypeScript end-to-end
- ✅ Modern React patterns
- ✅ Clean architecture
- ✅ Real-time updates
- ✅ Type-safe database queries
- ✅ Secure authentication

**אזורים לשיפור:**
- Password hashing
- Rate limiting
- Testing
- Monitoring
- Documentation

