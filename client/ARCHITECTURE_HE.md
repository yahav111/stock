# מדריך ארכיטקטורה - צד לקוח (Client)

## תוכן עניינים

1. [מבנה תיקיות](#1-מבנה-תיקיות)
2. [קבצים מרכזיים](#2-קבצים-מרכזיים)
3. [זרימת עבודה מלאה](#3-זרימת-עבודה-מלאה)
4. [נקודת כניסה](#4-נקודת-כניסה)
5. [החלטות ארכיטקטוניות](#5-החלטות-ארכיטקטוניות)
6. [הרחבות עתידיות](#6-הרחבות-עתידיות)
7. [דוגמה מוחשית](#7-דוגמה-מוחשית)
8. [אזהרות וטעויות נפוצות](#8-אזהרות-וטעויות-נפוצות)

---

## 1. מבנה תיקיות

### 📁 `client/src/`

זו התיקייה הראשית של הלקוח. כל הקוד של הלקוח נמצא כאן.

**מה יש כאן:**
- קבצי התחלה (`main.tsx`, `App.tsx`)
- תיקיות ארגון לפי תפקיד
- קבצי CSS ו-assets

**מה לא אמור להיות כאן:**
- קבצי קונפיגורציה של build tools (צריכים להיות ב-root)
- קבצי test (צריכים להיות ב-`__tests__` או `tests/`)

---

### 📁 `client/src/pages/`

תיקייה זו מכילה את כל הדפים (Pages) של האפליקציה.

**למה היא קיימת:**
- הפרדה בין דפים לקומפוננטות
- קל למצוא דפים
- קל להוסיף דפים חדשים

**מה האחריות שלה:**
- הגדרת מבנה הדף
- חיבור בין קומפוננטות
- ניהול state ברמת הדף

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת (צריכה להיות ב-hooks או stores)
- קומפוננטות קטנות (צריכות להיות ב-components/)

**קבצים:**
- `home.tsx` - דף הבית (ציבורי)
- `login.tsx` - דף התחברות
- `signup.tsx` - דף הרשמה
- `dashboard.tsx` - דף לוח הבקרה (מוגן)

---

### 📁 `client/src/components/`

תיקייה זו מכילה את כל הקומפוננטות של React.

**למה היא קיימת:**
- קומפוננטות לשימוש חוזר
- ארגון לפי סוג קומפוננטה

**מה האחריות שלה:**
- הצגת UI
- טיפול באירועי משתמש
- קריאה ל-hooks לקבלת נתונים

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת (צריכה להיות ב-hooks)
- ניהול state גלובלי (צריך להיות ב-stores)

**תת-תיקיות:**

#### 📁 `components/charts/`
**תפקיד:** קומפוננטות גרפים.

**דוגמאות:**
- `trading-chart.tsx` - גרף מסחר אינטראקטיבי (Lightweight Charts)
- `mini-chart.tsx` - גרף קטן להצגה מהירה

**מה יש כאן:**
- קומפוננטות שמשתמשות ב-Lightweight Charts
- לוגיקה של הצגת נתונים בגרף

**מה לא אמור להיות כאן:**
- קריאות ישירות ל-API (צריכות להיות ב-hooks)
- ניהול state גלובלי

#### 📁 `components/widgets/`
**תפקיד:** וידג'טים (widgets) ללוח הבקרה.

**דוגמאות:**
- `stock-ticker.tsx` - טיקר מניות
- `crypto-ticker.tsx` - טיקר קריפטו
- `watchlist.tsx` - רשימת מעקב
- `portfolio.tsx` - תיק השקעות
- `currency-converter.tsx` - ממיר מטבעות
- `market-news.tsx` - חדשות שוק

**מה יש כאן:**
- קומפוננטות עצמאיות שמציגות מידע
- כל widget יכול לעבוד לבד

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת

#### 📁 `components/layout/`
**תפקיד:** קומפוננטות של מבנה הדף.

**דוגמאות:**
- `header.tsx` - כותרת עליונה
- `sidebar.tsx` - תפריט צד

**מה יש כאן:**
- קומפוננטות שמגדירות את המבנה הכללי
- ניווט

#### 📁 `components/forms/`
**תפקיד:** טפסים.

**דוגמאות:**
- `login-form.tsx` - טופס התחברות
- `signup-form.tsx` - טופס הרשמה

**מה יש כאן:**
- טפסים עם validation (react-hook-form + zod)
- טיפול בהגשת טפסים

#### 📁 `components/common/`
**תפקיד:** קומפוננטות משותפות.

**דוגמאות:**
- `loading-spinner.tsx` - ספינר טעינה
- `price-change.tsx` - הצגת שינוי מחיר
- `stock-search.tsx` - חיפוש מניות

**מה יש כאן:**
- קומפוננטות קטנות לשימוש חוזר
- כלי עזר UI

#### 📁 `components/ui/`
**תפקיד:** קומפוננטות UI בסיסיות (Design System).

**דוגמאות:**
- `button.tsx` - כפתור
- `card.tsx` - כרטיס
- `input.tsx` - שדה קלט
- `dialog.tsx` - חלון דיאלוג
- `badge.tsx` - תג

**מה יש כאן:**
- קומפוננטות בסיסיות ללא לוגיקה עסקית
- יכולות לשמש בכל מקום באפליקציה

---

### 📁 `client/src/hooks/`

תיקייה זו מכילה את כל ה-React Hooks.

**למה היא קיימת:**
- הפרדה בין לוגיקה ל-UI
- שימוש חוזר בלוגיקה
- קל לבדוק hooks בנפרד

**מה האחריות שלה:**
- ניהול state מקומי
- קריאות ל-API
- טיפול ב-side effects

**מה לא אמור להיות כאן:**
- הצגת UI (צריכה להיות ב-components)
- ניהול state גלובלי (צריך להיות ב-stores)

**תת-תיקיות:**

#### 📁 `hooks/api/`
**תפקיד:** Hooks שמתחברים ל-API.

**דוגמאות:**
- `use-stocks.ts` - hooks למניות
- `use-crypto.ts` - hooks לקריפטו
- `use-chart.ts` - hooks לגרפים
- `use-auth.ts` - hooks לאימות
- `use-portfolio.ts` - hooks לתיק השקעות
- `use-news.ts` - hooks לחדשות
- `use-currencies.ts` - hooks למטבעות

**מה יש כאן:**
- Hooks שמשתמשים ב-React Query
- Query keys לניהול cache
- פונקציות לניהול cache (invalidate, prefetch)

**מה לא אמור להיות כאן:**
- קריאות ישירות ל-API (צריכות להיות ב-lib/api/)
- ניהול state גלובלי

**דוגמה:**
```typescript
// use-stocks.ts
export function useStock(symbol: string) {
  return useQuery({
    queryKey: stocksKeys.detail(symbol),
    queryFn: () => stocksApi.getStock(symbol),
    staleTime: 60 * 1000,
  });
}
```

#### 📁 `hooks/` (root level)
**תפקיד:** Hooks כלליים.

**דוגמאות:**
- `use-websocket.ts` - חיבור WebSocket
- `use-market-data.ts` - נתוני שוק

**מה יש כאן:**
- Hooks שלא קשורים ל-API ספציפי
- Hooks כלליים

---

### 📁 `client/src/lib/`

תיקייה זו מכילה כלי עזר וקוד משותף.

**למה היא קיימת:**
- קוד משותף שצריך במקומות רבים
- כלי עזר שלא שייכים לתחום ספציפי

**מה יש כאן:**
- פונקציות עזר
- קוד API
- validators

**מה לא אמור להיות כאן:**
- לוגיקה עסקית ספציפית
- קוד ששייך לתחום אחד בלבד

**תת-תיקיות:**

#### 📁 `lib/api/`
**תפקיד:** כל הקריאות ל-API של השרת.

**למה תיקייה נפרדת:**
- קל למצוא איפה קוראים ל-API
- אפשר לשנות API בלי לשבור את כל הקוד
- הפרדה בין API ל-hooks

**מה יש כאן:**
- `client.ts` - Axios instance עם interceptors
- `stocks.api.ts` - קריאות למניות
- `crypto.api.ts` - קריאות לקריפטו
- `chart.api.ts` - קריאות לגרפים
- `auth.api.ts` - קריאות לאימות
- `portfolio.api.ts` - קריאות לתיק השקעות
- `currencies.api.ts` - קריאות למטבעות
- `news.api.ts` - קריאות לחדשות
- `preferences.api.ts` - קריאות להעדפות

**מה לא אמור להיות כאן:**
- לוגיקה עסקית (צריכה להיות ב-hooks)
- ניהול state (צריך להיות ב-stores)

**דוגמה:**
```typescript
// stocks.api.ts
export async function getStock(symbol: string): Promise<StockQuote> {
  const response = await apiClient.get(`/stocks/${symbol}`);
  return unwrapResponse(response.data);
}
```

#### 📁 `lib/` (root level)
**תפקיד:** כלי עזר כלליים.

**קבצים:**
- `utils.ts` - פונקציות עזר (formatCurrency, formatPercentage, וכו')
- `validators.ts` - סכמות Zod ל-validation

---

### 📁 `client/src/stores/`

תיקייה זו מכילה את כל ה-state management (Zustand).

**למה היא קיימת:**
- ניהול state גלובלי
- שיתוף state בין קומפוננטות
- Persistence (שמירה ב-localStorage)

**מה האחריות שלה:**
- ניהול state גלובלי
- Actions לעדכון state
- Persistence

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת (צריכה להיות ב-hooks)
- קריאות ל-API (צריכות להיות ב-hooks/api/)

**קבצים:**
- `auth-store.ts` - state של אימות (משתמש, token)
- `dashboard-store.ts` - state של לוח הבקרה (מניות, קריפטו, watchlists)
- `websocket-store.ts` - state של WebSocket (חיבור, הודעות)

**דוגמה:**
```typescript
// auth-store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setSession: (session) => set({ ...session, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" }
  )
);
```

---

### 📁 `client/src/types/`

תיקייה זו מכילה את כל ה-TypeScript types.

**למה היא קיימת:**
- הגדרת types מרכזית
- שימוש חוזר ב-types
- קל למצוא types

**מה יש כאן:**
- `index.ts` - כל ה-types

**מה לא אמור להיות כאן:**
- לוגיקה
- קוד

---

## 2. קבצים מרכזיים

### 📄 `client/src/main.tsx`

**תפקיד:** נקודת הכניסה של האפליקציה. זה הקובץ הראשון שרץ כשהדפדפן טוען את האפליקציה.

**מי קורא לו:**
- Vite כשטוען את האפליקציה
- זה הקובץ שמוגדר ב-`index.html` כ-entry point

**למי הוא קורא:**
- `App.tsx` - הקומפוננטה הראשית
- React Query Provider - לניהול cache
- React Router - לניווט

**מה יקרה אם אמחק אותו:**
- האפליקציה לא תעבוד בכלל
- זה כמו למחוק את הדלת הראשית של הבית

**מה הקובץ עושה:**
1. יוצר React Query client עם הגדרות ברירת מחדל
2. מגדיר event listener ל-`auth:unauthorized`
3. מפעיל את React app עם כל ה-providers

**קוד:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

---

### 📄 `client/src/App.tsx`

**תפקיד:** הקומפוננטה הראשית של האפליקציה. מגדירה את כל ה-routes.

**מי קורא לו:**
- `main.tsx` - מפעיל את הקומפוננטה

**למי הוא קורא:**
- React Router - לניהול routes
- `pages/` - כל הדפים
- `stores/auth-store.ts` - לבדיקת אימות

**מה יקרה אם אמחק אותו:**
- האפליקציה לא תדע איזה דף להציג
- כל ה-routes לא יעבדו

**מה הקובץ עושה:**
1. מגדיר routes עם React Router
2. מגדיר Protected Routes (דורשות אימות)
3. מגדיר Public Routes (מפנות לדשבורד אם מחוברים)
4. מאזין ל-`auth:unauthorized` events

**קוד:**
```typescript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
</Routes>
```

---

### 📄 `client/src/lib/api/client.ts`

**תפקיד:** Axios instance עם interceptors לאימות, טיפול בשגיאות, ו-retry logic.

**מי קורא לו:**
- כל קבצי ה-API (`stocks.api.ts`, `crypto.api.ts`, וכו')

**למי הוא קורא:**
- שום דבר - זה singleton instance

**מה יקרה אם אמחק אותו:**
- כל הקריאות ל-API לא יעבדו
- אין authentication headers
- אין טיפול בשגיאות

**מה הקובץ עושה:**

#### Request Interceptor:
1. מוסיף Authorization header מ-localStorage
2. מוסיף timestamp למניעת cache
3. לוגים ב-development

#### Response Interceptor:
1. מטפל ב-401 (Unauthorized) - מנקה auth state ומפנה לדף הבית
2. מטפל ב-429 (Rate Limited)
3. מטפל ב-500+ (Server Error)
4. מטפל בשגיאות רשת

**קוד:**
```typescript
apiClient.interceptors.request.use((config) => {
  // הוסף token
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // מנקה auth ומפנה
      clearAuth();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

---

### 📄 `client/src/lib/api/stocks.api.ts`

**תפקיד:** כל הקריאות ל-API של מניות.

**מי קורא לו:**
- `hooks/api/use-stocks.ts` - hooks שמשתמשים ב-React Query

**למי הוא קורא:**
- `client.ts` - Axios instance

**מה יקרה אם אמחק אותו:**
- כל הקריאות למניות לא יעבדו
- צריך לכתוב את הקריאות במקום אחר

**מה הקובץ עושה:**
1. מגדיר פונקציות async לכל endpoint
2. משתמש ב-`apiClient` (Axios instance)
3. משתמש ב-`unwrapResponse` לחילוץ נתונים

**דוגמאות:**
- `getStock(symbol)` - GET `/api/stocks/:symbol`
- `getStocks(symbols)` - GET `/api/stocks?symbols=...`
- `getHistory(params)` - GET `/api/stocks/:symbol/history`
- `search(params)` - GET `/api/stocks/search`

---

### 📄 `client/src/hooks/api/use-stocks.ts`

**תפקיד:** React Query hooks למניות.

**מי קורא לו:**
- קומפוננטות שצריכות נתוני מניות

**למי הוא קורא:**
- `stocks.api.ts` - קריאות ל-API
- React Query - לניהול cache

**מה יקרה אם אמחק אותו:**
- קומפוננטות לא יוכלו לקבל נתוני מניות
- צריך לכתוב את הלוגיקה בכל קומפוננטה (לא מומלץ)

**מה הקובץ עושה:**
1. מגדיר query keys לניהול cache
2. מגדיר hooks עם React Query
3. מגדיר staleTime, refetchInterval, וכו'
4. מספק פונקציות לניהול cache (invalidate, prefetch)

**דוגמאות:**
- `useStock(symbol)` - hook למניה אחת
- `useStocks(symbols)` - hook למספר מניות
- `useStockHistory(params)` - hook להיסטוריה
- `useStockSearch(params)` - hook לחיפוש

**קוד:**
```typescript
export function useStock(symbol: string) {
  return useQuery({
    queryKey: stocksKeys.detail(symbol),
    queryFn: () => stocksApi.getStock(symbol),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
```

---

### 📄 `client/src/stores/auth-store.ts`

**תפקיד:** ניהול state של אימות (Zustand).

**מי קורא לו:**
- קומפוננטות שצריכות לדעת אם המשתמש מחובר
- `App.tsx` - לבדיקת Protected Routes

**למי הוא קורא:**
- Zustand persist - לשמירה ב-localStorage

**מה יקרה אם אמחק אותו:**
- אין ניהול state של אימות
- Protected Routes לא יעבדו
- צריך לכתוב את הלוגיקה במקום אחר

**מה הקובץ עושה:**
1. מגדיר state (user, token, isAuthenticated)
2. מגדיר actions (setSession, logout, וכו')
3. שומר ב-localStorage עם Zustand persist

**קוד:**
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setSession: (session) => set({ ...session, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" }
  )
);
```

---

### 📄 `client/src/stores/dashboard-store.ts`

**תפקיד:** ניהול state של לוח הבקרה.

**מי קורא לו:**
- קומפוננטות בלוח הבקרה
- `use-websocket.ts` - לעדכון נתונים בזמן אמת

**למי הוא קורא:**
- Zustand persist - לשמירה ב-localStorage

**מה יקרה אם אמחק אותו:**
- אין ניהול state של לוח הבקרה
- WebSocket updates לא יעבדו
- Watchlists לא ישמרו

**מה הקובץ עושה:**
1. מגדיר state (stocks, cryptos, currencies, watchlists)
2. מגדיר actions (updateStock, addToWatchlist, וכו')
3. שומר watchlists ב-localStorage

**קוד:**
```typescript
updateStock: (symbol, data) =>
  set((state) => ({
    stocks: {
      ...state.stocks,
      [symbol]: { ...state.stocks[symbol], ...data, timestamp: Date.now() },
    },
  })),
```

---

### 📄 `client/src/hooks/use-websocket.ts`

**תפקיד:** Hook לחיבור WebSocket ועדכונים בזמן אמת.

**מי קורא לו:**
- `dashboard.tsx` - כדי לקבל עדכונים בזמן אמת

**למי הוא קורא:**
- `websocket-store.ts` - לניהול חיבור WebSocket
- `dashboard-store.ts` - לעדכון נתונים

**מה יקרה אם אמחק אותו:**
- אין עדכונים בזמן אמת
- צריך לכתוב את הלוגיקה במקום אחר

**מה הקובץ עושה:**
1. מתחבר ל-WebSocket ב-mount
2. מאזין להודעות
3. מעדכן את dashboard-store לפי סוג ההודעה
4. מספק פונקציות subscribe/unsubscribe

**קוד:**
```typescript
useEffect(() => {
  if (!lastMessage) return;
  
  const { type, payload } = lastMessage;
  
  switch (type) {
    case "stock-update":
      updateStock(payload.symbol, payload);
      break;
    case "crypto-update":
      updateCrypto(payload.symbol, payload);
      break;
  }
}, [lastMessage]);
```

---

### 📄 `client/src/pages/dashboard.tsx`

**תפקיד:** דף לוח הבקרה הראשי.

**מי קורא לו:**
- React Router - כשמגיעים ל-`/dashboard`

**למי הוא קורא:**
- כל ה-widgets (StockTicker, CryptoTicker, Watchlist, וכו')
- `use-websocket.ts` - לחיבור WebSocket
- `dashboard-store.ts` - לנתונים

**מה יקרה אם אמחק אותו:**
- דף הדשבורד לא יעבוד
- צריך לכתוב דף חדש

**מה הקובץ עושה:**
1. מגדיר את המבנה של הדשבורד
2. מחבר את כל ה-widgets
3. מטפל ב-URL params (symbol, range)
4. מתחבר ל-WebSocket

**קוד:**
```typescript
const symbol = searchParams.get("symbol") || "AAPL";
const { subscribeToStocks, subscribeToCrypto } = useWebSocket();

useEffect(() => {
  if (isConnected) {
    subscribeToStocks(watchlistStocks);
    subscribeToCrypto(watchlistCrypto);
  }
}, [isConnected]);
```

---

### 📄 `client/src/components/charts/trading-chart.tsx`

**תפקיד:** קומפוננטת גרף מסחר אינטראקטיבי.

**מי קורא לו:**
- `dashboard.tsx` - להצגת גרף

**למי הוא קורא:**
- `use-chart.ts` - לקבלת נתוני גרף
- `dashboard-store.ts` - לנתונים בזמן אמת
- Lightweight Charts - להצגת הגרף

**מה יקרה אם אמחק אותו:**
- אין גרף מסחר
- צריך לכתוב קומפוננטה חדשה

**מה הקובץ עושה:**
1. יוצר גרף עם Lightweight Charts
2. טוען נתונים מ-`use-chart.ts`
3. מעדכן את הגרף עם נתונים בזמן אמת מ-WebSocket
4. מטפל בשינויי timeframe
5. מציג search bar

---

## 3. זרימת עבודה מלאה

### דוגמה: טעינת דף דשבורד עם גרף

#### שלב 1: המשתמש נכנס ל-`/dashboard`

**מה קורה:**
- הדפדפן מבקש את הדף
- React Router בודק routes

**אילו נתונים נכנסים:**
- URL: `/dashboard`

**אילו נתונים יוצאים:**
- עדיין אין - רק התחלנו

**איפה זה קורה:**
- `App.tsx` - React Router בודק routes
- `dashboard.tsx` - הקומפוננטה מתחילה לרוץ

---

#### שלב 2: בדיקת אימות

**מה קורה:**
- `ProtectedRoute` בודק אם המשתמש מחובר
- קורא ל-`useAuthStore()` כדי לבדוק `isAuthenticated`

**אילו נתונים נכנסים:**
- State מ-`auth-store.ts`

**אילו נתונים יוצאים:**
- אם לא מחובר: redirect ל-`/`
- אם מחובר: ממשיך ל-dashboard

**איפה זה קורה:**
- `App.tsx` - `ProtectedRoute` component

---

#### שלב 3: טעינת Dashboard

**מה קורה:**
- `DashboardPage` מתחיל לרוץ
- קורא ל-`useWebSocket()` כדי להתחבר
- קורא ל-`useDashboardStore()` כדי לקבל watchlists

**אילו נתונים נכנסים:**
- Watchlists מ-localStorage (דרך dashboard-store)

**אילו נתונים יוצאים:**
- עדיין אין - רק טוען

**איפה זה קורה:**
- `pages/dashboard.tsx`

---

#### שלב 4: חיבור WebSocket

**מה קורה:**
- `useWebSocket()` קורא ל-`connect(WS_URL)`
- `websocket-store.ts` יוצר חיבור WebSocket
- שולח subscribe message ל-watchlist symbols

**אילו נתונים נכנסים:**
- Watchlist symbols: `["AAPL", "GOOGL", "MSFT", ...]`

**אילו נתונים יוצאים:**
- WebSocket connection
- Subscribe messages

**איפה זה קורה:**
- `hooks/use-websocket.ts`
- `stores/websocket-store.ts`

---

#### שלב 5: טעינת גרף

**מה קורה:**
- `TradingChart` מתחיל לרוץ
- קורא ל-`useChart({ symbol: "AAPL", range: "1D" })`
- `use-chart.ts` קורא ל-`chart.api.ts`
- `chart.api.ts` קורא ל-`apiClient.get("/chart?symbol=AAPL&range=1D")`

**אילו נתונים נכנסים:**
- Symbol: "AAPL"
- Range: "1D"

**אילו נתונים יוצאים:**
- Request: `GET /api/chart?symbol=AAPL&range=1D`

**איפה זה קורה:**
- `components/charts/trading-chart.tsx`
- `hooks/api/use-chart.ts`
- `lib/api/chart.api.ts`
- `lib/api/client.ts` (Axios interceptor מוסיף token)

---

#### שלב 6: קבלת תגובה מהשרת

**מה קורה:**
- השרת מחזיר: `{ success: true, data: { symbol: "AAPL", bars: [...], ... } }`
- `apiClient` interceptor מטפל בתגובה
- `chart.api.ts` משתמש ב-`unwrapResponse()` לחילוץ נתונים
- React Query שומר ב-cache

**אילו נתונים נכנסים:**
- Response: `{ success: true, data: {...} }`

**אילו נתונים יוצאים:**
- Data: `{ symbol: "AAPL", bars: [...], ... }`
- נשמר ב-React Query cache

**איפה זה קורה:**
- `lib/api/client.ts` - response interceptor
- `lib/api/chart.api.ts` - `unwrapResponse()`
- React Query - cache

---

#### שלב 7: הצגת הגרף

**מה קורה:**
- `TradingChart` מקבל את הנתונים מ-React Query
- יוצר גרף עם Lightweight Charts
- מצייר את ה-bars על הגרף

**אילו נתונים נכנסים:**
- Chart data: `{ bars: [...], symbol: "AAPL", ... }`

**אילו נתונים יוצאים:**
- גרף מוצג על המסך

**איפה זה קורה:**
- `components/charts/trading-chart.tsx`

---

#### שלב 8: עדכון בזמן אמת

**מה קורה:**
- WebSocket מקבל הודעה: `{ type: "stock-update", payload: { symbol: "AAPL", price: 150.5, ... } }`
- `use-websocket.ts` מטפל בהודעה
- קורא ל-`updateStock("AAPL", payload)` ב-dashboard-store
- `TradingChart` מקבל עדכון מ-dashboard-store
- מעדכן את הגרף

**אילו נתונים נכנסים:**
- WebSocket message: `{ type: "stock-update", payload: {...} }`

**אילו נתונים יוצאים:**
- עדכון ב-dashboard-store
- עדכון בגרף

**איפה זה קורה:**
- `stores/websocket-store.ts` - מקבל הודעה
- `hooks/use-websocket.ts` - מטפל בהודעה
- `stores/dashboard-store.ts` - מעדכן state
- `components/charts/trading-chart.tsx` - מעדכן גרף

---

## 4. נקודת כניסה

### איפה האפליקציה מתחילה לרוץ?

**הקובץ:** `client/src/main.tsx`

**איך זה עובד:**

1. **הדפדפן טוען את הקובץ:**
   ```html
   <!-- index.html -->
   <script type="module" src="/src/main.tsx"></script>
   ```

2. **הקובץ יוצר React Query client:**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 60 * 1000,
         retry: 1,
       },
     },
   });
   ```

3. **מפעיל את React app:**
   ```typescript
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <QueryClientProvider client={queryClient}>
       <App />
     </QueryClientProvider>
   );
   ```

4. **App.tsx מגדיר routes:**
   ```typescript
   <BrowserRouter>
     <Routes>
       <Route path="/" element={<HomePage />} />
       <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
     </Routes>
   </BrowserRouter>
   ```

---

### איך React Router מחובר?

**הזרימה:**

```
main.tsx
  ↓
App.tsx
  ↓
BrowserRouter
  ↓
Routes
  ↓
Route path="/dashboard"
  ↓
ProtectedRoute (בודק אימות)
  ↓
DashboardPage
```

**דוגמה קונקרטית:**

1. משתמש נכנס ל-`/dashboard`

2. React Router בודק routes:
   - `/dashboard` → מוצא `Route` עם `DashboardPage`
   - `ProtectedRoute` בודק אימות
   - אם מחובר: מציג `DashboardPage`
   - אם לא: redirect ל-`/`

---

### איך בקשה מגיעה בפועל ל-API?

**הזרימה המלאה:**

```
1. קומפוננטה קוראת ל-hook
   ↓
2. Hook קורא ל-API function
   ↓
3. API function קורא ל-apiClient
   ↓
4. apiClient (Axios) מוסיף headers (token)
   ↓
5. שולח HTTP request לשרת
   ↓
6. שרת מחזיר response
   ↓
7. apiClient interceptor מטפל בתגובה
   ↓
8. API function מחזיר נתונים
   ↓
9. React Query שומר ב-cache
   ↓
10. Hook מחזיר נתונים לקומפוננטה
```

---

## 5. החלטות ארכיטקטוניות

### למה React Query ולא useState + useEffect?

**הבעיה עם useState + useEffect:**
```typescript
// ❌ גישה רעה - צריך לכתוב הכל בעצמנו
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/stocks/AAPL')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);
```

**הבעיות:**
- צריך לכתוב loading state בכל מקום
- צריך לכתוב error handling בכל מקום
- אין cache - כל פעם טוען מחדש
- אין retry logic
- אין refetching אוטומטי

**הפתרון - React Query:**
```typescript
// ✅ גישה טובה - React Query עושה הכל
const { data, isLoading, error } = useStock("AAPL");
```

**היתרונות:**
- Cache אוטומטי
- Loading states אוטומטיים
- Error handling אוטומטי
- Retry logic
- Refetching אוטומטי
- Stale-while-revalidate

---

### למה Zustand ולא Redux?

**הבעיה עם Redux:**
- הרבה boilerplate
- קשה להבין
- צריך actions, reducers, selectors
- קשה לבדוק

**הפתרון - Zustand:**
```typescript
// ✅ פשוט וקל
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

**היתרונות:**
- פשוט מאוד
- פחות boilerplate
- קל להבין
- יש persistence מובנה
- TypeScript support מעולה

---

### למה API Client נפרד ולא קריאות ישירות?

**הבעיה עם קריאות ישירות:**
```typescript
// ❌ גישה רעה - קריאה ישירה בכל מקום
const response = await fetch('/api/stocks/AAPL');
const data = await response.json();
```

**הבעיות:**
- צריך להוסיף headers בכל מקום
- צריך לטפל בשגיאות בכל מקום
- קשה לשנות base URL
- אין interceptors

**הפתרון - API Client:**
```typescript
// ✅ גישה טובה - API Client מרכזי
const response = await apiClient.get('/stocks/AAPL');
```

**היתרונות:**
- Headers אוטומטיים (token)
- Error handling מרכזי
- Interceptors (request/response)
- קל לשנות base URL
- Logging מרכזי

---

### למה Hooks נפרדים מ-API?

**הגישה הרעה - הכל ב-hook:**
```typescript
// ❌ גישה רעה - הכל ב-hook
function useStock(symbol: string) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/stocks/${symbol}`)
      .then(res => res.json())
      .then(setData);
  }, [symbol]);
  
  return data;
}
```

**הבעיות:**
- Hook תלוי ב-fetch
- קשה לבדוק
- קשה לעשות שימוש חוזר

**הגישה הטובה - הפרדה:**
```typescript
// ✅ API נפרד
// stocks.api.ts
export async function getStock(symbol: string) {
  return apiClient.get(`/stocks/${symbol}`);
}

// use-stocks.ts
function useStock(symbol: string) {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => stocksApi.getStock(symbol),
  });
}
```

**היתרונות:**
- API יכול לשמש גם בלי React
- קל לבדוק API בנפרד
- Hook פשוט - רק React Query
- קל לעשות שימוש חוזר

---

### למה WebSocket Store נפרד?

**הגישה הרעה - הכל ב-component:**
```typescript
// ❌ גישה רעה - הכל ב-component
function Dashboard() {
  const [ws, setWs] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://...');
    ws.onmessage = (event) => {
      // טיפול בהודעה
    };
    setWs(ws);
  }, []);
}
```

**הבעיות:**
- קשה לשתף בין קומפוננטות
- קשה לנהל subscriptions
- קשה לבדוק

**הגישה הטובה - Store:**
```typescript
// ✅ Store נפרד
export const useWebSocketStore = create((set) => ({
  connect: (url) => { /* ... */ },
  subscribe: (subscription) => { /* ... */ },
}));
```

**היתרונות:**
- שיתוף בין קומפוננטות
- ניהול subscriptions מרכזי
- קל לבדוק
- קל להוסיף features

---

## 6. הרחבות עתידיות

### איך להוסיף feature חדש?

**שלבים:**

#### 1. הוסף API function

```typescript
// lib/api/new-feature.api.ts
export async function getNewFeatureData(params: Params) {
  const response = await apiClient.get('/new-feature', { params });
  return unwrapResponse(response.data);
}
```

#### 2. הוסף Hook

```typescript
// hooks/api/use-new-feature.ts
export function useNewFeature(params: Params) {
  return useQuery({
    queryKey: ['new-feature', params],
    queryFn: () => newFeatureApi.getNewFeatureData(params),
  });
}
```

#### 3. הוסף Component

```typescript
// components/widgets/new-feature-widget.tsx
export function NewFeatureWidget() {
  const { data, isLoading } = useNewFeature({ ... });
  
  if (isLoading) return <LoadingSpinner />;
  
  return <div>{/* UI */}</div>;
}
```

#### 4. הוסף ל-Dashboard

```typescript
// pages/dashboard.tsx
<NewFeatureWidget />
```

---

### איך להוסיף Store חדש?

```typescript
// stores/new-store.ts
export const useNewStore = create<NewState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    { name: "new-storage" }
  )
);
```

---

### איך להוסיף Route חדש?

```typescript
// App.tsx
<Route path="/new-page" element={<NewPage />} />
```

---

## 7. דוגמה מוחשית

### Request: טעינת דף דשבורד עם גרף AAPL

**איזה קבצים מופעלים בסדר כרונולוגי:**

#### 1. `client/src/main.tsx` (שורה 30)
```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```
**מה קורה:** React מתחיל לרוץ

---

#### 2. `client/src/App.tsx` (שורה 54)
```typescript
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
```
**מה קורה:** React Router מוצא את ה-route

---

#### 3. `client/src/App.tsx` (שורה 10-18)
```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" />;
  return <>{children}</>;
}
```
**מה קורה:** בודק אימות - אם מחובר, ממשיך

---

#### 4. `client/src/pages/dashboard.tsx` (שורה 15)
```typescript
export function DashboardPage() {
  const { subscribeToStocks } = useWebSocket();
  // ...
}
```
**מה קורה:** Dashboard מתחיל לרוץ

---

#### 5. `client/src/pages/dashboard.tsx` (שורה 54)
```typescript
<TradingChart initialSymbol={symbol} />
```
**מה קורה:** TradingChart מתחיל לרוץ

---

#### 6. `client/src/components/charts/trading-chart.tsx` (שורה 88)
```typescript
const { data: chartData } = useChart({ symbol, range: "1D" });
```
**מה קורה:** קורא ל-hook לקבלת נתונים

---

#### 7. `client/src/hooks/api/use-chart.ts`
```typescript
export function useChart(params) {
  return useQuery({
    queryKey: ['chart', params],
    queryFn: () => chartApi.getChart(params),
  });
}
```
**מה קורה:** React Query בודק cache, אם אין - קורא ל-API

---

#### 8. `client/src/lib/api/chart.api.ts`
```typescript
export async function getChart(params) {
  const response = await apiClient.get('/chart', { params });
  return unwrapResponse(response.data);
}
```
**מה קורה:** קורא ל-API Client

---

#### 9. `client/src/lib/api/client.ts` (שורה 26)
```typescript
apiClient.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
**מה קורה:** מוסיף Authorization header

---

#### 10. HTTP Request נשלח לשרת
```
GET /api/chart?symbol=AAPL&range=1D
Headers: Authorization: Bearer <token>
```

---

#### 11. השרת מחזיר response
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "bars": [...],
    ...
  }
}
```

---

#### 12. `client/src/lib/api/client.ts` (שורה 67)
```typescript
apiClient.interceptors.response.use((response) => {
  return response;
});
```
**מה קורה:** Response interceptor מטפל בתגובה

---

#### 13. `client/src/lib/api/chart.api.ts` (שורה 7)
```typescript
return unwrapResponse(response.data);
```
**מה קורה:** מחלץ את הנתונים

---

#### 14. React Query שומר ב-cache
```typescript
// React Query שומר:
cache['chart', { symbol: 'AAPL', range: '1D' }] = data;
```

---

#### 15. `client/src/components/charts/trading-chart.tsx` (שורה 88)
```typescript
const { data: chartData } = useChart({ symbol, range: "1D" });
// chartData = { symbol: "AAPL", bars: [...], ... }
```
**מה קורה:** מקבל את הנתונים

---

#### 16. `client/src/components/charts/trading-chart.tsx` (שורה 120)
```typescript
chartRef.current = createChart(chartContainerRef.current, { ... });
seriesRef.current = chartRef.current.addCandlestickSeries({ ... });
seriesRef.current.setData(bars);
```
**מה קורה:** יוצר גרף ומציג את הנתונים

---

## 8. אזהרות וטעויות נפוצות

### ⚠️ איפה מפתחים מתחילים נוטים להתבלבל?

#### 1. **בלבול בין API ל-Hook**

**הטעות:**
```typescript
// ❌ קריאה ישירה ל-API ב-component
function StockWidget() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    stocksApi.getStock("AAPL").then(setData);
  }, []);
}
```

**הפתרון:**
```typescript
// ✅ שימוש ב-Hook
function StockWidget() {
  const { data } = useStock("AAPL");
}
```

**למה זה חשוב:**
- Hook משתמש ב-React Query (cache, loading, error)
- API function לא יודע על React

---

#### 2. **שימוש ישיר ב-axios במקום apiClient**

**הטעות:**
```typescript
// ❌ שימוש ישיר ב-axios
import axios from 'axios';
const response = await axios.get('/api/stocks/AAPL');
```

**הבעיה:**
- אין token headers
- אין error handling
- אין interceptors

**הפתרון:**
```typescript
// ✅ שימוש ב-apiClient
import apiClient from './lib/api/client';
const response = await apiClient.get('/stocks/AAPL');
```

---

#### 3. **שכחת Query Keys**

**הטעות:**
```typescript
// ❌ query key לא ייחודי
useQuery({
  queryKey: ['stock'], // אותו key לכל symbol!
  queryFn: () => stocksApi.getStock(symbol),
});
```

**הבעיה:**
- Cache לא עובד נכון
- נתונים מתערבבים

**הפתרון:**
```typescript
// ✅ query key ייחודי
useQuery({
  queryKey: ['stock', symbol], // ייחודי לכל symbol
  queryFn: () => stocksApi.getStock(symbol),
});
```

---

#### 4. **State Management לא נכון**

**הטעות:**
```typescript
// ❌ state מקומי במקום store
function Dashboard() {
  const [stocks, setStocks] = useState({});
  // ...
}
```

**הבעיה:**
- לא ניתן לשתף בין קומפוננטות
- State אובד ב-unmount

**הפתרון:**
```typescript
// ✅ שימוש ב-store
function Dashboard() {
  const { stocks } = useDashboardStore();
  // ...
}
```

---

### 🔴 איזה חלקים הכי רגישים לשינויים?

#### 1. **API Client Interceptors**

**למה רגיש:**
- אם משנים את הלוגיקה, כל הקריאות משתנות
- אם מוסיפים header חדש, צריך לבדוק הכל

**איך להיזהר:**
- תמיד לבדוק את כל ה-endpoints אחרי שינוי
- להוסיף tests
- לתעד שינויים

---

#### 2. **Query Keys**

**למה רגיש:**
- אם משנים את המבנה, cache נשבר
- אם מוסיפים parameter, צריך לעדכן הכל

**איך להיזהר:**
- להשתמש ב-helper functions (כמו `stocksKeys.detail(symbol)`)
- לא לשנות query keys קיימים
- להוסיף versioning אם צריך

---

#### 3. **Store Structure**

**למה רגיש:**
- אם משנים את המבנה, כל הקומפוננטות נשברות
- אם מוסיפים field, צריך לעדכן הכל

**איך להיזהר:**
- לא לשנות fields קיימים
- להוסיף fields חדשים (backward compatible)
- להשתמש ב-TypeScript

---

### 💡 טיפים למפתחים

#### 1. **תמיד להשתמש ב-React Query Devtools**

```typescript
// main.tsx
{import.meta.env.DEV && <ReactQueryDevtools />}
```

**למה:**
- רואים את כל ה-queries
- רואים את ה-cache
- קל למצוא באגים

---

#### 2. **תמיד לטפל ב-Loading ו-Error States**

```typescript
// ✅ טיפול נכון
const { data, isLoading, error } = useStock("AAPL");

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <StockData data={data} />;
```

**למה:**
- UX טוב יותר
- משתמשים יודעים מה קורה

---

#### 3. **תמיד להשתמש ב-TypeScript**

```typescript
// ✅ TypeScript
interface StockQuote {
  symbol: string;
  price: number;
}

function useStock(symbol: string): UseQueryResult<StockQuote> {
  // ...
}
```

**למה:**
- מונע שגיאות בזמן ריצה
- קל למצוא בעיות
- קוד יותר בטוח

---

#### 4. **תמיד לבדוק את ה-Console**

```typescript
// API Client כבר לוגים ב-development
console.log(`🌐 API Request: GET /stocks/AAPL`);
console.log(`✅ API Response: ...`);
```

**למה:**
- רואים את כל הקריאות
- קל למצוא באגים
- קל להבין את הזרימה

---

## סיכום

### המבנה הכללי:

```
User Action
    ↓
Component
    ↓
Hook (React Query)
    ↓
API Function
    ↓
API Client (Axios)
    ↓
Server
    ↓
Response
    ↓
React Query Cache
    ↓
Component Update
```

### עקרונות חשובים:

1. **הפרדת אחריות** - כל קובץ עושה דבר אחד
2. **React Query** - לניהול cache ו-data fetching
3. **Zustand** - לניהול state גלובלי
4. **API Client** - לקריאות מרכזיות עם interceptors
5. **Hooks** - לשימוש חוזר בלוגיקה

### איך להוסיף דברים חדשים:

1. **API חדש:** הוסף קובץ ב-`lib/api/`
2. **Hook חדש:** הוסף קובץ ב-`hooks/api/`
3. **Component חדש:** הוסף קובץ ב-`components/`
4. **Store חדש:** הוסף קובץ ב-`stores/`

---

**זה הכל!** עכשיו אתה מבין את כל הארכיטקטורה של הצד לקוח. אם יש שאלות - תשאל!

