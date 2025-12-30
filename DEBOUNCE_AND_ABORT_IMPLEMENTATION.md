# סיכום מימוש Debounce ו-AbortController

## 🔍 ההבדל בין Chart ו-Search

### **Search Queries** (חיפוש מניות/קריפטו):
- **מטרה**: מציאת רשימת תוצאות חיפוש (autocomplete)
- **תגובה**: מהירה (מילישניות)
- **תדירות**: כל הקלדה → יוצר הרבה בקשות
- **בעיה**: race conditions, בקשות מיותרות

### **Chart Queries** (גרף מניות/קריפטו):
- **מטרה**: טעינת נתונים היסטוריים לגרף
- **תגובה**: איטית יותר (שניות)
- **תדירות**: כל שינוי symbol → יוצר בקשה חדשה
- **בעיה**: בקשות ב-Pending, צוואר בקבוק בשרת

---

## 📁 שינויים לפי קבצים

### 1. **`client/src/hooks/use-debounce.ts`** (קובץ חדש)

**מה עשיתי:**
- יצרתי custom hook חדש ל-debounce
- מחזיר ערך מעוכב ב-500ms

**קוד:**
```typescript
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
```

**למה זה חשוב:**
- מונע בקשות מיותרות - רק אחרי שהמשתמש הפסיק להקליד

---

### 2. **`client/src/lib/api/stocks.api.ts`**

**מה שיניתי:**
- הוספתי פרמטר `signal?: AbortSignal` לפונקציה `search()`
- העברתי את ה-signal ל-axios

**לפני:**
```typescript
export async function search(params: SearchParams): Promise<SearchResult[]> {
  const response = await apiClient.get<ApiSuccessResponse<SearchResult[]>>(
    '/stocks/search',
    { params }
  );
  return unwrapResponse(response.data);
}
```

**אחרי:**
```typescript
export async function search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult[]> {
  const response = await apiClient.get<ApiSuccessResponse<SearchResult[]>>(
    '/stocks/search',
    { params, signal }  // ✅ הוספתי signal
  );
  return unwrapResponse(response.data);
}
```

**למה זה חשוב:**
- מאפשר ביטול בקשות קודמות באמצעות AbortController

---

### 3. **`client/src/lib/api/crypto.api.ts`**

**מה שיניתי:**
- אותו דבר כמו stocks - הוספתי `signal?: AbortSignal`

**לפני:**
```typescript
export async function search(params: SearchParams): Promise<SearchResult[]>
```

**אחרי:**
```typescript
export async function search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult[]>
```

---

### 4. **`client/src/lib/api/chart.api.ts`**

**מה שיניתי:**
- הוספתי `signal?: AbortSignal` ל-2 פונקציות:
  1. `getChartData()` - לגרפים רגילים
  2. `getForexChartData()` - לגרפי forex

**לפני:**
```typescript
export async function getChartData(params: ChartDataParams): Promise<ChartDataResponse> {
  const response = await apiClient.get<ApiSuccessResponse<ChartDataResponse>>(
    '/chart',
    { params: { symbol, range } }
  );
  return unwrapResponse(response.data);
}
```

**אחרי:**
```typescript
export async function getChartData(params: ChartDataParams, signal?: AbortSignal): Promise<ChartDataResponse> {
  const response = await apiClient.get<ApiSuccessResponse<ChartDataResponse>>(
    '/chart',
    { params: { symbol, range }, signal }  // ✅ הוספתי signal
  );
  return unwrapResponse(response.data);
}
```

**למה זה חשוב:**
- מאפשר ביטול בקשות גרף ישנות כשהמשתמש מקליד סמל חדש

---

### 5. **`client/src/hooks/api/use-stocks.ts`**

**מה שיניתי:**
1. הוספתי שימוש ב-`signal` מ-TanStack Query
2. שיניתי את `enabled` מ-`params.q.length >= 1` ל-`params.q.length >= 2`

**לפני:**
```typescript
export function useStockSearch(params: StockSearchParams, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.search(params),
    queryFn: () => stocksApi.search(params),
    enabled: params.q.length >= 1 && enabled,  // ❌ מתחיל מ-1 תו
    staleTime: 5 * 60 * 1000,
  });
}
```

**אחרי:**
```typescript
export function useStockSearch(params: StockSearchParams, enabled = true) {
  return useQuery({
    queryKey: stocksKeys.search(params),
    queryFn: ({ signal }) => stocksApi.search(params, signal),  // ✅ הוספתי signal
    enabled: params.q.length >= 2 && enabled,  // ✅ מינימום 2 תווים
    staleTime: 5 * 60 * 1000,
  });
}
```

**למה זה חשוב:**
- `signal` - מבטל בקשות קודמות אוטומטית
- `>= 2` - מונע חיפושים קצרים מידי (יותר יעיל)

---

### 6. **`client/src/hooks/api/use-crypto.ts`**

**מה שיניתי:**
- אותו דבר כמו use-stocks.ts
- הוספתי `signal` ושיניתי `enabled` ל-`>= 2`

---

### 7. **`client/src/hooks/api/use-chart.ts`**

**מה שיניתי:**
- הוספתי `signal` ל-2 hooks:
  1. `useChart()` - לגרפים רגילים
  2. `useForexChart()` - לגרפי forex

**לפני:**
```typescript
export function useChart(params: ChartDataParams, enabled = true) {
  return useQuery({
    queryKey: chartKeys.chart(params),
    queryFn: () => chartApi.getChartData(params),  // ❌ בלי signal
    enabled: !!params.symbol && enabled,
    // ...
  });
}
```

**אחרי:**
```typescript
export function useChart(params: ChartDataParams, enabled = true) {
  return useQuery({
    queryKey: chartKeys.chart(params),
    queryFn: ({ signal }) => chartApi.getChartData(params, signal),  // ✅ עם signal
    enabled: !!params.symbol && enabled,
    // ...
  });
}
```

**למה זה חשוב:**
- כשהסמל משתנה, הבקשה הקודמת מתבטלת מיד
- מונע בקשות "זומבי" ב-Pending

---

### 8. **`client/src/components/common/stock-search.tsx`**

**מה שיניתי:**
1. הוספתי import של `useDebounce`
2. הוספתי debounce של 500ms על ה-query
3. שיניתי את ה-query להשתמש ב-`debouncedQuery` במקום `query`
4. הוספתי מצב loading משופר עם `isFetching`

**לפני:**
```typescript
const [query, setQuery] = useState(value)

const { data: searchResults, isLoading } = useStockSearch(
  { q: query, limit: 8 },
  query.length >= 1 && isOpen && !isCryptoMatch && !isForexMatch
)
```

**אחרי:**
```typescript
const [query, setQuery] = useState(value)

// ✅ Debounce עם 500ms
const debouncedQuery = useDebounce(query, 500)

// ✅ משתמש ב-debouncedQuery + מוסיף isFetching
const { data: searchResults, isLoading, isFetching } = useStockSearch(
  { q: debouncedQuery, limit: 8 },
  debouncedQuery.length >= 2 && isOpen && !isCryptoMatch && !isForexMatch
)

// ✅ מצב loading משופר
const isSearching = (query.length >= 2 && query !== debouncedQuery) || isFetching
```

**למה זה חשוב:**
- Debounce - רק אחרי 500ms ללא הקלדה → מבצע חיפוש
- `>= 2` - לא מחפש מ-1 תו
- `isFetching` - מציג "Searching..." גם במהלך debounce

---

### 9. **`client/src/components/common/portfolio-stock-search.tsx`**

**מה שיניתי:**
1. החלפתי את ה-debounce הישן (300ms) ב-`useDebounce` hook (500ms)
2. שיניתי ל-`>= 2` תווים
3. הוספתי `isFetching` למצב loading משופר

**לפני:**
```typescript
const [debouncedQuery, setDebouncedQuery] = useState(value)

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query)
  }, 300)  // ❌ 300ms
  return () => clearTimeout(timer)
}, [query])
```

**אחרי:**
```typescript
// ✅ משתמש ב-hook
const debouncedQuery = useDebounce(query, 500)  // ✅ 500ms

// ✅ מצב loading משופר
const isSearching = (query.length >= 2 && query !== debouncedQuery) || isFetching
```

---

### 10. **`client/src/components/widgets/watchlist.tsx`**

**מה שיניתי:**
1. החלפתי debounce ידני ב-`useDebounce` hook
2. שיניתי מ-`>= 1` ל-`>= 2` תווים
3. הוספתי `isFetching` למצב loading משופר
4. הסרתי משתנים שלא בשימוש (`isLoading`)

**לפני:**
```typescript
const [debouncedQuery, setDebouncedQuery] = useState("")

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(newSymbol)
  }, 300)  // ❌ 300ms
  return () => clearTimeout(timer)
}, [newSymbol])

const { data: stockSearchResults, isLoading: isSearchingStocks } = useStockSearch(
  { q: debouncedQuery, limit: 8 },
  debouncedQuery.length >= 1 && isSearchOpen && activeTab === "stocks"  // ❌ >= 1
)
```

**אחרי:**
```typescript
// ✅ משתמש ב-hook
const debouncedQuery = useDebounce(newSymbol, 500)  // ✅ 500ms

const { data: stockSearchResults, isFetching: isFetchingStocks } = useStockSearch(
  { q: debouncedQuery, limit: 8 },
  debouncedQuery.length >= 2 && isSearchOpen && activeTab === "stocks"  // ✅ >= 2
)

// ✅ מצב loading משופר
const isSearching = 
  (newSymbol.length >= 2 && newSymbol !== debouncedQuery) || 
  isFetchingStocks || 
  isFetchingCrypto
```

---

### 11. **`client/src/components/charts/trading-chart.tsx`** (הקובץ הכי חשוב!)

**מה שיניתי:**
1. הוספתי `useDebounce` hook
2. יצרתי `searchTerm` state נפרד מה-`symbol` state
3. הוספתי `debouncedSearchTerm` שמתעדכן אחרי 500ms
4. ה-chart queries משתמשים ב-`debouncedSymbol` (לא ב-`symbol`)
5. ה-chart queries מופעלים רק כשיש `debouncedSymbol` תקין
6. שיניתי cleanup ל-`debouncedSymbol` במקום `symbol`

**לפני:**
```typescript
const [symbol, setSymbol] = useState(initialSymbol)

const { data: chartData, isLoading: isLoadingHistory } = useChart(
  {
    symbol: cleanSymbol,
    range: rangeMap[timeframe],
  },
  !isForex && currentTimeframeConfig.available
);

const handleSymbolChange = (newSymbol: string) => {
  if (newSymbol && newSymbol !== symbol) {
    setSymbol(newSymbol)  // ❌ מתעדכן מיד → יוצר בקשה מיד
    if (onSymbolChange) onSymbolChange(newSymbol)
  }
}
```

**אחרי:**
```typescript
// ✅ שני states נפרדים
const [searchTerm, setSearchTerm] = useState(initialSymbol)
const [symbol, setSymbol] = useState(initialSymbol)

// ✅ Debounce עם 500ms
const debouncedSearchTerm = useDebounce(searchTerm, 500)

// ✅ מנרמל את ה-debounced term
const debouncedSymbol = useMemo(() => {
  if (!debouncedSearchTerm || debouncedSearchTerm.trim().length === 0) {
    return null
  }
  return debouncedSearchTerm.trim().toUpperCase()
}, [debouncedSearchTerm])

// ✅ מעדכן את symbol רק אחרי debounce
useEffect(() => {
  if (debouncedSymbol && debouncedSymbol !== symbol) {
    setSymbol(debouncedSymbol)
    if (onSymbolChange) onSymbolChange(debouncedSymbol)
  }
}, [debouncedSymbol, symbol, onSymbolChange])

// ✅ משתמש ב-debouncedSymbol ל-queries
const chartQuerySymbol = debouncedSymbol || symbol

// ✅ ה-enabled תלוי ב-debouncedSymbol
const hasValidDebouncedTerm = debouncedSymbol !== null && debouncedSymbol.length >= 1
const chartEnabled = !isForex && currentTimeframeConfig.available && hasValidDebouncedTerm

const { data: chartData, isLoading: isLoadingHistory } = useChart(
  {
    symbol: cleanSymbol,  // cleanSymbol מבוסס על chartQuerySymbol
    range: rangeMap[timeframe],
  },
  chartEnabled  // ✅ רק כשיש debouncedSymbol תקין
);

// ✅ handlers נפרדים
const handleSearchChange = (newSearchTerm: string) => {
  setSearchTerm(newSearchTerm)  // ✅ מתעדכן מיד (ל-display)
}

const handleSymbolSelect = (selectedSymbol: string) => {
  const upperSymbol = selectedSymbol.toUpperCase()
  setSearchTerm(upperSymbol)
  setSymbol(upperSymbol)  // ✅ מתעדכן מיד (כשנבחר מהרשימה)
  if (onSymbolChange) onSymbolChange(upperSymbol)
}
```

**למה זה חשוב:**
- **Debounce**: ה-chart queries מתבצעים רק אחרי 500ms ללא הקלדה
- **Sync**: ה-queries מסונכרנים עם ה-debounced term
- **Abort**: כשהסמל משתנה, TanStack Query מבטל את הבקשה הקודמת
- **Cleanup**: ה-series מתנקית מיד כשהסמל משתנה

---

## 🎯 סיכום הכללים שנשמרו

### ✅ Debounce (500ms)
- **Search**: כל קומפוננטות החיפוש משתמשות ב-`useDebounce`
- **Chart**: ה-`trading-chart.tsx` משתמש ב-debounce לפני עדכון symbol

### ✅ AbortSignal
- **כל API functions** מקבלות `signal?: AbortSignal`
- **כל hooks** מעבירים את ה-`signal` מ-TanStack Query
- **אוטומטי**: כשהחיפוש משתנה, הבקשה הקודמת מתבטלת

### ✅ Minimum Characters
- **Search**: מינימום 2 תווים (`params.q.length >= 2`)
- **Chart**: מינימום 1 תו (`debouncedSymbol.length >= 1`)

### ✅ Loading States
- **`isSearching`**: מציג "Searching..." גם במהלך debounce
- **`isFetching`**: מציג מצב loading בזמן fetch בפועל

### ✅ Cleanup
- **Chart series**: מתנקה מיד כשהסמל משתנה
- **TanStack Query**: מבטל בקשות אוטומטית דרך AbortSignal
- **Unmount**: כל ה-cleanups פועלים נכון

---

## 📊 תוצאות

### לפני:
- ❌ כל הקלדה → בקשה חדשה
- ❌ Race conditions
- ❌ בקשות ב-Pending שלא נגמרות
- ❌ עומס על השרת

### אחרי:
- ✅ Debounce 500ms → רק בקשות נחוצות
- ✅ AbortSignal → ביטול בקשות קודמות
- ✅ Minimum 2 תווים → פחות בקשות
- ✅ Cleanup נכון → אין בקשות "זומבי"
- ✅ ביצועים טובים יותר 🚀

