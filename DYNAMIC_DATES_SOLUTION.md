# פתרון: גרפים דינמיים עם תאריכים מעודכנים

## הבעיה שהייתה

הגרפים נעצרו בתאריך קבוע (19 בדצמבר) למרות שהיום 22 בדצמבר.

**סיבות:**
1. Cache key לא כלל תאריך → מחזיר נתונים ישנים
2. `to` לא תמיד היום
3. `from` לא מחושב נכון
4. Frontend לא refetch כשמשנים timeframe

---

## הפתרון

### 1. Cache Key עם תאריך

**לפני:**
```typescript
const cacheKey = `history:${symbol}:${timespan}:${limit}`;
// בעיה: אותו key כל יום → מחזיר נתונים ישנים
```

**אחרי:**
```typescript
const today = new Date().toISOString().split('T')[0]; // "2025-12-22"
const cacheKey = `history:${symbol}:${timespan}:${limit}:${today}`;
// ✅ כל יום key חדש → מביא נתונים חדשים
```

---

### 2. חישוב דינמי של `from` ו-`to`

#### למניות (Polygon.io):

**לפני:**
```typescript
const to = new Date(); // היום
const from = new Date();
from.setDate(from.getDate() - limit - 10); // חישוב לא מדויק
```

**אחרי:**
```typescript
// 'to' תמיד אתמול (יום מסחר אחרון)
const to = new Date();
to.setDate(to.getDate() - 1);
while (to.getDay() === 0 || to.getDay() === 6) {
  to.setDate(to.getDate() - 1); // דילוג על סופי שבוע
}
to.setHours(23, 59, 59, 999);

// 'from' מחושב דינמית לפי timespan
if (timespan === 'day') {
  const extraDays = Math.ceil(limit * 0.3); // 30% נוסף לסופי שבוע
  from.setDate(from.getDate() - limit - extraDays);
} else if (timespan === 'week') {
  from.setDate(from.getDate() - (limit * 7));
} else if (timespan === 'month') {
  from.setMonth(from.getMonth() - limit);
}
```

#### לקריפטו (CryptoCompare):

**לפני:**
```typescript
// רק limit - לא תאריכים
limit: 30
```

**אחרי:**
```typescript
// CryptoCompare תמיד מחזיר עד היום אוטומטית
// רק צריך לוודא שה-cache key כולל תאריך
const today = new Date().toISOString().split('T')[0];
const cacheKey = `crypto-history:${symbol}:${timespan}:${limit}:${today}`;
```

---

### 3. Frontend - Refetch אוטומטי

**לפני:**
```typescript
staleTime: 60 * 60 * 1000, // שעה קבועה
// בעיה: לא refetch כשמשנים timeframe
```

**אחרי:**
```typescript
// staleTime דינמי לפי range
const staleTime = params.range === '1D' 
  ? 60 * 60 * 1000      // שעה ליום
  : params.range === '1W'
  ? 6 * 60 * 60 * 1000  // 6 שעות לשבוע
  : 24 * 60 * 60 * 1000; // 24 שעות לחודש

// Refetch אוטומטי
refetchInterval: params.range === '1D' 
  ? 60 * 60 * 1000      // כל שעה ליום
  : params.range === '1W'
  ? 6 * 60 * 60 * 1000  // כל 6 שעות לשבוע
  : false;              // לא refetch אוטומטי לחודש
```

---

## איך זה עובד עכשיו

### דוגמה: `GET /api/chart?symbol=BTC&range=1D`

#### שלב 1: Backend מקבל בקשה
```typescript
// chart.controller.ts
const { symbol, range = '1D' } = req.query;
// symbol = "BTC", range = "1D"
```

#### שלב 2: Service מזהה סוג
```typescript
// chart.service.ts
const symbolType = detectSymbolType("BTC"); // "crypto"
const provider = CryptoChartProvider;
```

#### שלב 3: Provider בודק Cache
```typescript
// crypto-chart-provider.ts
const today = new Date().toISOString().split('T')[0]; // "2025-12-22"
const cacheKey = `crypto-history:BTC:day:30:2025-12-22`;

const cached = getCached(cacheKey);
if (cached) return cached; // ✅ אם יש cache מהיום - מחזיר
```

#### שלב 4: Provider מביא נתונים
```typescript
// CryptoCompare API תמיד מחזיר עד היום
const response = await axios.get(
  "https://min-api.cryptocompare.com/data/v2/histoday",
  { params: { fsym: "BTC", tsym: "USD", limit: 30 } }
);
// ✅ מחזיר 30 הימים האחרונים עד היום
```

#### שלב 5: Cache נשמר עם תאריך
```typescript
setCache("crypto-history:BTC:day:30:2025-12-22", bars);
// ✅ מחר ה-key יהיה שונה → יביא נתונים חדשים
```

---

## מה השתנה בקבצים

### Backend:

1. **`polygon.service.ts`**:
   - ✅ Cache key כולל תאריך
   - ✅ `to` תמיד אתמול (יום מסחר אחרון)
   - ✅ `from` מחושב דינמית
   - ✅ Mock data משתמש בתאריך נוכחי

2. **`crypto-chart-provider.ts`**:
   - ✅ Cache key כולל תאריך
   - ✅ TTL דינמי לפי timespan
   - ✅ Mock data משתמש בתאריך נוכחי

### Frontend:

3. **`use-chart.ts`**:
   - ✅ `staleTime` דינמי לפי range
   - ✅ `refetchInterval` דינמי
   - ✅ `refetchOnWindowFocus` מופעל

---

## תוצאות

### לפני:
- ❌ גרף נעצר ב-19 בדצמבר
- ❌ Cache מחזיר נתונים ישנים
- ❌ לא refetch אוטומטי

### אחרי:
- ✅ גרף תמיד מעודכן עד היום
- ✅ Cache מתעדכן כל יום
- ✅ Refetch אוטומטי לפי range
- ✅ עובד גם למניות וגם לקריפטו

---

## בדיקה

**נסה:**
1. פתח גרף של BTC או AAPL
2. בדוק שהתאריך האחרון הוא היום או אתמול
3. שנה timeframe (1D → 1W → 1M)
4. בדוק שהגרף מתעדכן
5. רענן את הדפדפן
6. בדוק שהגרף עדיין מעודכן

---

## הערות חשובות

1. **מניות**: משתמשות ב-אתמול כי שוק המניות נסגר בסוף היום
2. **קריפטו**: משתמשות ב-היום כי שוק הקריפטו 24/7
3. **Cache**: מתעדכן כל יום אוטומטית (key כולל תאריך)
4. **Refetch**: אוטומטי לפי range (יותר תכוף ל-1D, פחות ל-1M)

---

## אם יש בעיות

1. **גרף עדיין לא מעודכן:**
   - בדוק את ה-logs ב-console
   - בדוק שה-cache key כולל תאריך
   - נסה לנקות cache ידנית

2. **יותר מדי קריאות API:**
   - Cache אמור למנוע את זה
   - בדוק שה-TTL נכון

3. **נתונים לא נכונים:**
   - בדוק את ה-logs של ה-API
   - בדוק שהתאריכים מחושבים נכון

