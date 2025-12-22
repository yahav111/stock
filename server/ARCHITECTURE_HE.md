# מדריך ארכיטקטורה - מערכת גרפים מאוחדת

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

### 📁 `server/src/`

זו התיקייה הראשית של השרת. כל הקוד של השרת נמצא כאן.

**מה יש כאן:**
- קבצי התחלה (`index.ts`)
- תיקיות ארגון לפי תפקיד

**מה לא אמור להיות כאן:**
- קבצי קונפיגורציה של build tools
- קבצי test (צריכים להיות ב-`__tests__` או `tests/`)

---

### 📁 `server/src/api/`

תיקייה זו מכילה את כל ה-API endpoints. זה המקום שבו בקשות HTTP מגיעות ומטופלות.

**למה היא קיימת:**
- הפרדה בין לוגיקת API ללוגיקת עסקים
- קל למצוא endpoints
- קל להוסיף endpoints חדשים

**מה האחריות שלה:**
- קבלת בקשות HTTP
- אימות נתונים (validation)
- קריאה ל-services
- החזרת תגובות

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת (צריכה להיות ב-services)
- קריאות ישירות ל-APIs חיצוניים (צריכות להיות ב-services/external-apis)
- לוגיקה של מסד נתונים (צריכה להיות ב-services או db/)

**תת-תיקיות:**

#### 📁 `api/controllers/`
**תפקיד:** מטפלים בבקשות HTTP ספציפיות.

**דוגמה:** `chart.controller.ts` - מטפל בבקשות ל-`/api/chart`

**מה יש כאן:**
- פונקציות שמקבלות `Request` ו-`Response`
- קריאה ל-services
- החזרת תגובות

**מה לא אמור להיות כאן:**
- לוגיקה עסקית (צריכה להיות ב-service)
- אימות נתונים (צריך להיות ב-validators)

#### 📁 `api/routes/`
**תפקיד:** מגדירים את ה-routes (נתיבים) של ה-API.

**דוגמה:** `chart.routes.ts` - מגדיר ש-`GET /api/chart` קורא ל-`chart.controller.getChart`

**מה יש כאן:**
- הגדרת routes עם Express Router
- חיבור routes ל-controllers
- הוספת middleware (כמו validation)

**מה לא אמור להיות כאן:**
- לוגיקה עסקית
- controllers (צריכים להיות ב-controllers/)

#### 📁 `api/validators/`
**תפקיד:** מגדירים את כללי האימות (validation) לנתונים.

**דוגמה:** `chart.validators.ts` - מגדיר ש-`symbol` הוא חובה ו-`range` יכול להיות רק '1D', '1W', או '1M'

**מה יש כאן:**
- סכמות Zod (validation library)
- טיפוסים TypeScript

**מה לא אמור להיות כאן:**
- לוגיקה עסקית
- קריאות ל-APIs

#### 📁 `api/middleware/`
**תפקיד:** פונקציות ביניים (middleware) שרצות לפני או אחרי ה-controllers.

**דוגמאות:**
- `validate.middleware.ts` - בודק שהנתונים תקינים לפני שהם מגיעים ל-controller
- `error.middleware.ts` - מטפל בשגיאות
- `auth.middleware.ts` - בודק שהמשתמש מחובר

**מה יש כאן:**
- פונקציות שמקבלות `Request`, `Response`, ו-`next`
- לוגיקה שצריכה לרוץ על כל הבקשות (או רוב)

**מה לא אמור להיות כאן:**
- לוגיקה ספציפית ל-endpoint אחד (צריכה להיות ב-controller)

---

### 📁 `server/src/services/`

תיקייה זו מכילה את כל הלוגיקה העסקית. זה המקום שבו הקוד "חושב" מה לעשות.

**למה היא קיימת:**
- הפרדה בין API ללוגיקה עסקית
- אפשר לבדוק את הלוגיקה בלי HTTP
- אפשר לעשות שימוש חוזר בקוד

**מה האחריות שלה:**
- ביצוע לוגיקה עסקית
- תיאום בין חלקים שונים
- קריאה ל-APIs חיצוניים

**מה לא אמור להיות כאן:**
- טיפול ישיר ב-HTTP requests (צריך להיות ב-api/)
- הגדרת routes (צריכה להיות ב-api/routes/)

**תת-תיקיות:**

#### 📁 `services/chart/`
**תפקיד:** כל הלוגיקה הקשורה לגרפים (מניות וקריפטו).

**למה תיקייה נפרדת:**
- יש הרבה קבצים הקשורים לגרפים
- קל למצוא קוד הקשור לגרפים
- אפשר להוסיף features חדשים לגרפים בלי לשבור דברים אחרים

**מה יש כאן:**
- `chart.service.ts` - השירות המרכזי שמחליט איזה provider להשתמש
- `symbol-detector.ts` - מזהה אם symbol הוא מניה או קריפטו
- `types.ts` - טיפוסים משותפים
- `providers/` - ה-providers השונים

**מה לא אמור להיות כאן:**
- קריאות ישירות ל-APIs חיצוניים (צריכות להיות ב-external-apis/)
- הגדרת routes (צריכה להיות ב-api/routes/)

#### 📁 `services/chart/providers/`
**תפקיד:** מיישמים את ה-Adapter Pattern - כל provider יודע איך לדבר עם API ספציפי.

**למה תיקייה נפרדת:**
- כל provider הוא יחידה עצמאית
- קל להוסיף provider חדש (למשל Forex)
- קל לבדוק כל provider בנפרד

**מה יש כאן:**
- `chart-provider.interface.ts` - הממשק שכל provider צריך לממש
- `stock-chart-provider.ts` - provider למניות (Polygon.io)
- `crypto-chart-provider.ts` - provider לקריפטו (CryptoCompare)

**מה לא אמור להיות כאן:**
- לוגיקה עסקית מורכבת (צריכה להיות ב-chart.service.ts)
- קריאות ישירות ל-APIs (צריכות להיות ב-external-apis/)

#### 📁 `services/external-apis/`
**תפקיד:** כל הקריאות ל-APIs חיצוניים (Polygon, CryptoCompare, וכו').

**למה תיקייה נפרדת:**
- קל למצוא איפה קוראים ל-API מסוים
- אפשר לשנות API בלי לשבור את כל הקוד
- אפשר להוסיף caching מרכזי

**מה יש כאן:**
- `polygon.service.ts` - כל הקריאות ל-Polygon.io API
- `cryptocompare.service.ts` - כל הקריאות ל-CryptoCompare API
- `openexchange.service.ts` - כל הקריאות ל-Open Exchange Rates API

**מה לא אמור להיות כאן:**
- לוגיקה עסקית (צריכה להיות ב-services/)
- הגדרת routes (צריכה להיות ב-api/routes/)

---

### 📁 `server/src/lib/`

תיקייה זו מכילה כלי עזר (utilities) ששימושיים בכל הפרויקט.

**למה היא קיימת:**
- קוד משותף שצריך במקומות רבים
- כלי עזר שלא שייכים לתחום ספציפי

**מה יש כאן:**
- `api-response.ts` - פונקציות ליצירת תגובות API אחידות
- `api-error.ts` - מחלקות שגיאה מותאמות אישית
- `async-handler.ts` - wrapper לטיפול בשגיאות ב-async functions

**מה לא אמור להיות כאן:**
- לוגיקה עסקית ספציפית
- קוד ששייך לתחום אחד בלבד

---

### 📁 `server/src/config/`

תיקייה זו מכילה הגדרות וקונפיגורציה.

**מה יש כאן:**
- `env.ts` - טעינת משתני סביבה
- `constants.ts` - קבועים (למשל רשימת מניות ברירת מחדל)

**מה לא אמור להיות כאן:**
- לוגיקה עסקית
- קוד שמשתנה בזמן ריצה

---

## 2. קבצים מרכזיים

### 📄 `server/src/index.ts`

**תפקיד:** נקודת הכניסה של השרת. זה הקובץ הראשון שרץ כשמפעילים את השרת.

**מי קורא לו:**
- Node.js כשמריצים `npm run dev`
- זה הקובץ שמוגדר ב-`package.json` כ-entry point

**למי הוא קורא:**
- `api/routes/index.ts` - כדי לטעון את כל ה-routes
- `websocket/index.ts` - כדי להפעיל WebSocket
- `db/index.ts` - כדי להתחבר למסד נתונים

**מה יקרה אם אמחק אותו:**
- השרת לא יעבוד בכלל
- זה כמו למחוק את הדלת הראשית של הבית

**מה הקובץ עושה:**
1. יוצר Express app
2. מגדיר middleware (CORS, JSON parsing, וכו')
3. מחבר routes
4. מגדיר error handlers
5. מפעיל WebSocket
6. מתחיל את השרת להאזין על פורט 3001

---

### 📄 `server/src/api/routes/index.ts`

**תפקיד:** מקבץ את כל ה-routes תחת `/api`.

**מי קורא לו:**
- `index.ts` (הקובץ הראשי) בשורה: `app.use('/api', apiRoutes)`

**למי הוא קורא:**
- כל ה-route modules (stocks.routes.ts, chart.routes.ts, וכו')
- מחבר אותם תחת `/api`

**מה יקרה אם אמחק אותו:**
- כל ה-routes לא יעבדו
- צריך יהיה לחבר כל route ישירות ב-index.ts (לא מומלץ)

**מה הקובץ עושה:**
```typescript
// לוקח את כל ה-routes ומחבר אותם:
router.use('/stocks', stocksRoutes);    // → /api/stocks/*
router.use('/crypto', cryptoRoutes);    // → /api/crypto/*
router.use('/chart', chartRoutes);      // → /api/chart/*
```

---

### 📄 `server/src/api/routes/chart.routes.ts`

**תפקיד:** מגדיר את ה-route `/api/chart`.

**מי קורא לו:**
- `api/routes/index.ts` - מחבר אותו ל-router הראשי

**למי הוא קורא:**
- `validate.middleware.ts` - כדי לוודא שהנתונים תקינים
- `chart.controller.ts` - כדי לטפל בבקשה

**מה יקרה אם אמחק אותו:**
- ה-endpoint `/api/chart` לא יעבוד
- אבל שאר ה-endpoints יעבדו

**מה הקובץ עושה:**
```typescript
// מגדיר: GET /api/chart?symbol=XXX&range=1D
router.get(
  '/',                                    // הנתיב (יחסית ל-/api/chart)
  validate({ query: validators.getChartQuery }),  // אימות
  asyncHandler(controller.getChart)      // הטיפול
);
```

---

### 📄 `server/src/api/controllers/chart.controller.ts`

**תפקיד:** מטפל בבקשות ל-`/api/chart`.

**מי קורא לו:**
- `chart.routes.ts` - כשמישהו שולח GET request ל-`/api/chart`

**למי הוא קורא:**
- `chart.service.ts` - כדי לקבל את הנתונים
- `api-response.js` - כדי ליצור תגובה אחידה

**מה יקרה אם אמחק אותו:**
- ה-endpoint `/api/chart` יחזיר 404
- אבל שאר ה-endpoints יעבדו

**מה הקובץ עושה:**
1. מקבל `symbol` ו-`range` מה-query parameters
2. ממיר `range` ל-`timespan` ו-`limit` (למשל "1D" → day, 30)
3. קורא ל-`chartService.getChartData()`
4. מחזיר את הנתונים בתגובה JSON

**דוגמה:**
```typescript
// בקשה: GET /api/chart?symbol=BTC&range=1D
// הקובץ מקבל: { symbol: "BTC", range: "1D" }
// ממיר ל: { symbol: "BTC", timespan: "day", limit: 30 }
// קורא ל-service
// מחזיר: { success: true, data: { symbol: "BTC", type: "crypto", bars: [...] } }
```

---

### 📄 `server/src/services/chart/chart.service.ts`

**תפקיד:** השירות המרכזי שמחליט איזה provider להשתמש.

**מי קורא לו:**
- `chart.controller.ts` - כשצריך נתוני גרף

**למי הוא קורא:**
- `symbol-detector.ts` - כדי לזהות אם זה crypto או stock
- `StockChartProvider` או `CryptoChartProvider` - כדי לקבל את הנתונים

**מה יקרה אם אמחק אותו:**
- כל ה-endpoint `/api/chart` לא יעבוד
- צריך יהיה לכתוב את הלוגיקה ב-controller (לא מומלץ)

**מה הקובץ עושה:**
1. מקבל `symbol` (למשל "BTC")
2. קורא ל-`detectSymbolType()` - מזהה שזה "crypto"
3. מוצא את ה-provider המתאים (CryptoChartProvider)
4. קורא ל-provider לקבל נתונים
5. מחזיר נתונים אחידים (אותו פורמט למניות וקריפטו)

**למה זה חשוב:**
- ה-frontend לא צריך לדעת אם זה מניה או קריפטו
- ה-backend מחליט אוטומטית
- קל להוסיף סוגי נכסים חדשים

---

### 📄 `server/src/services/chart/symbol-detector.ts`

**תפקיד:** מזהה אם symbol הוא מטבע קריפטו או מניה.

**מי קורא לו:**
- `chart.service.ts` - כדי לדעת איזה provider להשתמש

**למי הוא קורא:**
- אף אחד - זה קובץ עצמאי עם לוגיקה פשוטה

**מה יקרה אם אמחק אותו:**
- המערכת לא תדע להבדיל בין מניות לקריפטו
- כל symbol יטופל כמניה (כי זה ה-default)

**מה הקובץ עושה:**
```typescript
// יש רשימה של 25 מטבעות קריפטו
const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'SOL', ...];

// הפונקציה בודקת:
function detectSymbolType(symbol: string) {
  if (SUPPORTED_CRYPTOS.includes(symbol)) {
    return 'crypto';
  }
  return 'stock';
}
```

**למה רשימה סטטית:**
- מהיר מאוד (לא צריך קריאת API)
- פשוט
- קל לעדכן (פשוט להוסיף לרשימה)

---

### 📄 `server/src/services/chart/providers/stock-chart-provider.ts`

**תפקיד:** Adapter למניות - יודע איך לדבר עם Polygon.io API.

**מי קורא לו:**
- `chart.service.ts` - כשצריך נתוני מניה

**למי הוא קורא:**
- `polygon.service.ts` - כדי לקבל נתונים מ-Polygon.io

**מה יקרה אם אמחק אותו:**
- מניות לא יעבדו (רק קריפטו יעבוד)
- צריך יהיה לכתוב את הלוגיקה במקום אחר

**מה הקובץ עושה:**
1. מיישם את הממשק `IChartProvider`
2. `supports()` - מחזיר `true` אם זה מניה
3. `getHistory()` - קורא ל-Polygon.io וממיר לפורמט אחיד
4. `getQuote()` - קורא ל-Polygon.io וממיר לפורמט אחיד

**למה Adapter Pattern:**
- Polygon.io מחזיר נתונים בפורמט שלו
- המערכת צריכה נתונים בפורמט אחיד
- ה-Adapter ממיר בין הפורמטים

---

### 📄 `server/src/services/chart/providers/crypto-chart-provider.ts`

**תפקיד:** Adapter לקריפטו - יודע איך לדבר עם CryptoCompare API.

**מי קורא לו:**
- `chart.service.ts` - כשצריך נתוני קריפטו

**למי הוא קורא:**
- CryptoCompare API ישירות (axios)
- `cryptocompare.service.ts` - לקבלת quote

**מה יקרה אם אמחק אותו:**
- קריפטו לא יעבוד (רק מניות יעבדו)
- צריך יהיה לכתוב את הלוגיקה במקום אחר

**מה הקובץ עושה:**
1. מיישם את הממשק `IChartProvider`
2. `supports()` - מחזיר `true` אם זה קריפטו
3. `getHistory()` - קורא ל-CryptoCompare `/data/v2/histoday` וממיר לפורמט אחיד
4. `getQuote()` - קורא ל-`cryptocompare.service.ts` וממיר לפורמט אחיד
5. יש caching - שומר נתונים לשעה

**הבדלים מ-Stock Provider:**
- קורא ישירות ל-API (לא דרך service אחר)
- יש mock data fallback אם ה-API נכשל
- יש caching משוכלל יותר

---

### 📄 `server/src/services/chart/providers/chart-provider.interface.ts`

**תפקיד:** מגדיר את הממשק שכל provider צריך לממש.

**מי קורא לו:**
- `chart.service.ts` - כדי לדעת איזה methods יש לכל provider
- כל ה-providers - כדי לדעת מה לממש

**למי הוא קורא:**
- אף אחד - זה רק הגדרה (interface)

**מה יקרה אם אמחק אותו:**
- TypeScript לא יידע מה כל provider צריך לממש
- אפשר יהיה לשכוח לממש methods
- קוד פחות בטוח

**מה הקובץ עושה:**
```typescript
// מגדיר מה כל provider צריך לממש:
interface IChartProvider {
  getHistory(params): Promise<HistoricalBar[]>;
  getQuote(symbol): Promise<Quote>;
  supports(symbol): boolean;
}
```

**למה זה חשוב:**
- מבטיח שכל provider עובד באותו אופן
- TypeScript בודק שהכל מיושם נכון
- קל להוסיף provider חדש (יודע מה לממש)

---

## 3. זרימת עבודה מלאה

### בקשה לדוגמה: `GET /api/chart?symbol=BTC&range=1D`

#### שלב 1: HTTP Request מגיע לשרת

**מה קורה:**
- הדפדפן שולח: `GET http://localhost:3001/api/chart?symbol=BTC&range=1D`
- השרת מקבל את הבקשה

**אילו נתונים נכנסים:**
- URL: `/api/chart`
- Query parameters: `{ symbol: "BTC", range: "1D" }`
- Headers: Content-Type, Authorization (אם יש)

**אילו נתונים יוצאים:**
- עדיין אין - רק התחלנו

**איפה זה קורה:**
- `index.ts` - Express מקבל את הבקשה
- Middleware רצים (CORS, JSON parsing)

---

#### שלב 2: Routing - מציאת ה-Route הנכון

**מה קורה:**
- Express בודק איזה route מתאים
- מוצא ש-`/api/chart` מתאים ל-`chart.routes.ts`

**אילו נתונים נכנסים:**
- Request object עם כל המידע

**אילו נתונים יוצאים:**
- אותו Request, אבל עכשיו יודעים איזה controller לקרוא

**איפה זה קורה:**
- `api/routes/index.ts` - מפנה ל-`chart.routes.ts`
- `api/routes/chart.routes.ts` - מפנה ל-`chart.controller.getChart`

---

#### שלב 3: Validation - בדיקת הנתונים

**מה קורה:**
- `validate.middleware.ts` בודק שהנתונים תקינים
- בודק ש-`symbol` קיים וש-`range` הוא '1D', '1W', או '1M'

**אילו נתונים נכנסים:**
- Query parameters: `{ symbol: "BTC", range: "1D" }`

**אילו נתונים יוצאים:**
- אם תקין: ממשיך ל-controller
- אם לא תקין: מחזיר שגיאה 400

**איפה זה קורה:**
- `api/middleware/validate.middleware.ts`
- משתמש ב-`chart.validators.ts` כדי לדעת מה לבדוק

---

#### שלב 4: Controller - טיפול בבקשה

**מה קורה:**
- `chart.controller.getChart()` מתחיל לרוץ
- ממיר `range` ל-`timespan` ו-`limit`
- קורא ל-`chartService.getChartData()`

**אילו נתונים נכנסים:**
- `{ symbol: "BTC", range: "1D" }`

**אילו נתונים יוצאים:**
- `{ symbol: "BTC", timespan: "day", limit: 30 }` → ל-service

**איפה זה קורה:**
- `api/controllers/chart.controller.ts`

**קוד:**
```typescript
const rangeMap = {
  '1D': { timespan: 'day', limit: 30 },
  '1W': { timespan: 'week', limit: 52 },
  '1M': { timespan: 'month', limit: 12 },
};

const rangeConfig = rangeMap['1D']; // { timespan: 'day', limit: 30 }

const chartData = await chartService.getChartData({
  symbol: "BTC",
  timespan: "day",
  limit: 30
});
```

---

#### שלב 5: Service - החלטה איזה Provider להשתמש

**מה קורה:**
- `chart.service.getChartData()` מתחיל לרוץ
- קורא ל-`detectSymbolType("BTC")` → מחזיר "crypto"
- מוצא את `CryptoChartProvider`
- קורא ל-provider במקביל: `getHistory()` ו-`getQuote()`

**אילו נתונים נכנסים:**
- `{ symbol: "BTC", timespan: "day", limit: 30 }`

**אילו נתונים יוצאים:**
- `{ symbol: "BTC", type: "crypto", bars: [...], name: "Bitcoin" }`

**איפה זה קורה:**
- `services/chart/chart.service.ts`

**קוד:**
```typescript
// מזהה את הסוג
const symbolType = detectSymbolType("BTC"); // "crypto"

// מוצא את ה-provider
const provider = this.getProvider("BTC"); // CryptoChartProvider

// מביא נתונים במקביל
const [bars, quote] = await Promise.all([
  provider.getHistory({ symbol: "BTC", timespan: "day", limit: 30 }),
  provider.getQuote("BTC")
]);

// מחזיר תשובה אחידה
return {
  symbol: "BTC",
  type: "crypto",
  bars: [...],
  name: "Bitcoin"
};
```

---

#### שלב 6: Provider - קבלת נתונים מה-API החיצוני

**מה קורה:**
- `CryptoChartProvider.getHistory()` מתחיל לרוץ
- בודק cache - אם יש, מחזיר מיד
- אם אין, קורא ל-CryptoCompare API
- ממיר את הפורמט לפורמט אחיד

**אילו נתונים נכנסים:**
- `{ symbol: "BTC", timespan: "day", limit: 30 }`

**אילו נתונים יוצאים:**
- `HistoricalBar[]` - מערך של 30 bars בפורמט אחיד

**איפה זה קורה:**
- `services/chart/providers/crypto-chart-provider.ts`

**קוד:**
```typescript
// בודק cache
const cached = getCached("crypto-history:BTC:day:30");
if (cached) return cached;

// קורא ל-API
const response = await axios.get(
  "https://min-api.cryptocompare.com/data/v2/histoday",
  { params: { fsym: "BTC", tsym: "USD", limit: 30 } }
);

// ממיר לפורמט אחיד
const bars = response.data.Data.Data.map(bar => ({
  time: bar.time,        // Unix timestamp
  open: bar.open,
  high: bar.high,
  low: bar.low,
  close: bar.close,
  volume: bar.volumefrom
}));

// שומר ב-cache
setCache("crypto-history:BTC:day:30", bars);

return bars;
```

---

#### שלב 7: Response - החזרת התגובה

**מה קורה:**
- Controller מקבל את הנתונים מה-service
- יוצר תגובה JSON אחידה
- שולח חזרה ל-client

**אילו נתונים נכנסים:**
- `{ symbol: "BTC", type: "crypto", bars: [...], name: "Bitcoin" }`

**אילו נתונים יוצאים:**
- JSON response:
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "type": "crypto",
    "bars": [
      { "time": 1763769600, "open": 43500, "high": 44000, "low": 43000, "close": 43800, "volume": 1234567890 },
      ...
    ],
    "name": "Bitcoin"
  },
  "meta": {
    "symbol": "BTC",
    "type": "crypto",
    "barCount": 30
  }
}
```

**איפה זה קורה:**
- `api/controllers/chart.controller.ts`
- משתמש ב-`api-response.js` כדי ליצור תגובה אחידה

---

## 4. נקודת כניסה

### איפה השרת מתחיל לרוץ?

**הקובץ:** `server/src/index.ts`

**איך זה עובד:**

1. **Node.js מריץ את הקובץ:**
   ```bash
   npm run dev
   # → node --loader tsx src/index.ts
   ```

2. **הקובץ יוצר Express app:**
   ```typescript
   const app = express();
   const server = createServer(app);
   ```

3. **מגדיר Middleware:**
   ```typescript
   app.use(cors({ ... }));           // מאפשר קריאות מדפדפן
   app.use(express.json());          // מפענח JSON
   app.use(cookieParser());          // מפענח cookies
   ```

4. **מחבר Routes:**
   ```typescript
   app.use('/api', apiRoutes);      // כל ה-routes תחת /api
   ```

5. **מפעיל WebSocket:**
   ```typescript
   setupWebSocket(server);
   ```

6. **מתחיל להאזין:**
   ```typescript
   server.listen(3001, () => {
     console.log('Server is ready!');
   });
   ```

---

### איך Express Router מחובר?

**הזרימה:**

```
index.ts
  ↓
app.use('/api', apiRoutes)
  ↓
api/routes/index.ts
  ↓
router.use('/chart', chartRoutes)
  ↓
api/routes/chart.routes.ts
  ↓
router.get('/', controller.getChart)
  ↓
api/controllers/chart.controller.ts
```

**דוגמה קונקרטית:**

1. בקשה מגיעה: `GET /api/chart?symbol=BTC`

2. Express בודק routes:
   - `/api` → מוצא `apiRoutes` (מ-index.ts)
   - `/chart` → מוצא `chartRoutes` (מ-api/routes/index.ts)
   - `/` → מוצא `GET /` (מ-chart.routes.ts)

3. Express מריץ:
   - Middleware: `validate.middleware`
   - Controller: `chart.controller.getChart`

---

### איך בקשה מגיעה בפועל ל-chart endpoint?

**הזרימה המלאה:**

```
1. דפדפן שולח HTTP Request
   ↓
2. Request מגיע ל-Express (index.ts)
   ↓
3. Express בודק routes:
   - /api → apiRoutes
   - /chart → chartRoutes  
   - / → GET handler
   ↓
4. Middleware רצים:
   - CORS
   - JSON parsing
   - Validation
   ↓
5. Controller מתחיל לרוץ:
   - chart.controller.getChart()
   ↓
6. Controller קורא ל-Service:
   - chartService.getChartData()
   ↓
7. Service קורא ל-Provider:
   - CryptoChartProvider.getHistory()
   ↓
8. Provider קורא ל-External API:
   - CryptoCompare API
   ↓
9. נתונים חוזרים דרך כל השכבות
   ↓
10. Response נשלח חזרה לדפדפן
```

---

## 5. החלטות ארכיטקטוניות

### למה Service + Provider ולא הכל בקובץ אחד?

**הבעיה עם קובץ אחד:**
```typescript
// ❌ גישה רעה - הכל בקובץ אחד
async function getChart(symbol) {
  if (symbol === 'BTC' || symbol === 'ETH') {
    // קוד לקריפטו
    const response = await axios.get('cryptocompare...');
    // ... 100 שורות קוד
  } else {
    // קוד למניות
    const response = await axios.get('polygon...');
    // ... 100 שורות קוד
  }
}
```

**הבעיות:**
- קובץ ענק (200+ שורות)
- קשה לקרוא
- קשה לבדוק
- קשה להוסיף סוג נכס חדש
- אם Polygon משנה משהו, צריך לחפש בכל הקובץ

**הפתרון - Service + Provider:**
```typescript
// ✅ גישה טובה - הפרדת אחריות
// Service - מחליט איזה provider
chartService.getChartData() → בוחר provider

// Provider - יודע איך לדבר עם API ספציפי
StockChartProvider → Polygon.io
CryptoChartProvider → CryptoCompare
```

**היתרונות:**
- כל קובץ קטן ומובן
- קל לבדוק כל חלק בנפרד
- קל להוסיף provider חדש (Forex, Commodities)
- אם API משתנה, משנים רק provider אחד

---

### מה היתרון של Adapter Pattern כאן?

**הבעיה בלי Adapter:**

כל API מחזיר נתונים בפורמט שונה:

```typescript
// Polygon.io מחזיר:
{
  results: [{
    t: 1763769600000,  // timestamp במילישניות
    o: 150.5,          // open
    h: 152.0,          // high
    l: 149.0,          // low
    c: 151.0,          // close
    v: 1000000         // volume
  }]
}

// CryptoCompare מחזיר:
{
  Data: {
    Data: [{
      time: 1763769600,    // timestamp בשניות
      open: 43500,
      high: 44000,
      low: 43000,
      close: 43800,
      volumefrom: 1234567890
    }]
  }
}
```

**הבעיה:**
- Frontend צריך לדעת איזה API זה
- צריך לכתוב קוד שונה לכל API
- אם משנים API, צריך לשנות את כל הקוד

**הפתרון - Adapter Pattern:**

כל Provider ממיר לפורמט אחיד:

```typescript
// Stock Provider ממיר:
Polygon format → Unified format

// Crypto Provider ממיר:
CryptoCompare format → Unified format

// Service מקבל תמיד:
{
  time: number,    // תמיד בשניות
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
}
```

**היתרונות:**
- Frontend לא צריך לדעת איזה API זה
- קוד אחד עובד עם כל ה-APIs
- אם משנים API, משנים רק את ה-Adapter
- קל להוסיף API חדש (פשוט adapter חדש)

---

### למה Backend מחליט ולא Frontend?

**הגישה הרעה - Frontend מחליט:**
```typescript
// ❌ Frontend צריך לדעת
if (SUPPORTED_CRYPTOS.includes(symbol)) {
  // קורא ל-/api/crypto/history
} else {
  // קורא ל-/api/stocks/history
}
```

**הבעיות:**
- Frontend צריך לדעת את הרשימה
- אם משנים רשימה, צריך לעדכן Frontend
- Frontend צריך לטפל בשני endpoints שונים
- קשה לשתף קישורים (צריך לדעת איזה endpoint)

**הגישה הטובה - Backend מחליט:**
```typescript
// ✅ Frontend פשוט קורא ל-/api/chart
// Backend מחליט אוטומטית
GET /api/chart?symbol=BTC
// Backend: "BTC זה קריפטו, אני אקרא ל-CryptoCompare"
```

**היתרונות:**
- Frontend פשוט - endpoint אחד
- Backend שולט בלוגיקה
- קל לשתף קישורים
- אם משנים רשימה, משנים רק Backend

---

## 6. הרחבות עתידיות

### איך להוסיף סוג נכס נוסף (Forex / Commodities)?

**שלבים:**

#### 1. עדכן את Symbol Detector

```typescript
// services/chart/symbol-detector.ts

// הוסף רשימה חדשה
const SUPPORTED_FOREX = ['EUR', 'GBP', 'JPY', ...] as const;

export function detectSymbolType(symbol: string): SymbolType {
  const upperSymbol = symbol.toUpperCase();
  
  if (SUPPORTED_CRYPTOS.includes(upperSymbol)) return 'crypto';
  if (SUPPORTED_FOREX.includes(upperSymbol)) return 'forex';  // ← חדש
  return 'stock';
}
```

#### 2. צור Provider חדש

```typescript
// services/chart/providers/forex-chart-provider.ts

export class ForexChartProvider implements IChartProvider {
  supports(symbol: string): boolean {
    return isForex(symbol);
  }

  async getHistory(params: ChartDataParams): Promise<HistoricalBar[]> {
    // קוד לדבר עם Forex API
    // ממיר לפורמט אחיד
  }

  async getQuote(symbol: string) {
    // קוד לקבלת quote
  }
}
```

#### 3. הוסף ל-Service

```typescript
// services/chart/chart.service.ts

constructor() {
  this.providers = [
    new StockChartProvider(),
    new CryptoChartProvider(),
    new ForexChartProvider(),  // ← חדש
  ];
}
```

**זה הכל!** Frontend לא צריך שינויים - הוא פשוט קורא ל-`/api/chart` כמו קודם.

---

### איך להוסיף Cache?

**יש כבר Cache ב-Crypto Provider**, אבל אפשר לשפר:

#### 1. Cache מרכזי

```typescript
// services/chart/cache.service.ts

class ChartCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  get(key: string, ttl: number) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }
  
  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

#### 2. Redis Cache (לפרודקשן)

```typescript
// services/chart/redis-cache.service.ts

import Redis from 'ioredis';

class RedisCache {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, data: any, ttl: number) {
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
}
```

#### 3. שימוש ב-Service

```typescript
// services/chart/chart.service.ts

async getChartData(params: ChartDataParams) {
  const cacheKey = `chart:${params.symbol}:${params.timespan}:${params.limit}`;
  
  // בודק cache
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;
  
  // מביא נתונים
  const data = await this.fetchFromProvider(params);
  
  // שומר ב-cache
  await cacheService.set(cacheKey, data, 3600); // שעה
  
  return data;
}
```

---

### איך להוסיף Authentication?

#### 1. הוסף Middleware

```typescript
// api/middleware/auth.middleware.ts

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  // בודק את ה-token
  const user = verifyToken(token);
  req.user = user;  // מוסיף למשתנה request
  
  next();
}
```

#### 2. הוסף ל-Route

```typescript
// api/routes/chart.routes.ts

router.get(
  '/',
  requireAuth,                    // ← חדש
  validate({ query: validators.getChartQuery }),
  asyncHandler(controller.getChart)
);
```

#### 3. השתמש ב-Controller

```typescript
// api/controllers/chart.controller.ts

export async function getChart(req: Request, res: Response) {
  const user = req.user;  // מהמשתנה שה-middleware הוסיף
  
  // אפשר לבדוק הרשאות
  if (!user.canViewCharts) {
    throw ApiError.forbidden('No permission to view charts');
  }
  
  // ... שאר הקוד
}
```

---

## 7. דוגמה מוחשית

### Request: `GET /api/chart?symbol=BTC&range=1D`

**איזה קבצים מופעלים בסדר כרונולוגי:**

#### 1. `server/src/index.ts` (שורה 50)
```typescript
app.use('/api', apiRoutes);
```
**מה קורה:** Express מפנה את הבקשה ל-`apiRoutes`

---

#### 2. `server/src/api/routes/index.ts` (שורה 34)
```typescript
router.use('/chart', chartRoutes);
```
**מה קורה:** Router מפנה את `/chart` ל-`chartRoutes`

---

#### 3. `server/src/api/routes/chart.routes.ts` (שורה 16-20)
```typescript
router.get(
  '/',
  validate({ query: validators.getChartQuery }),
  asyncHandler(controller.getChart)
);
```
**מה קורה:**
- מוצא ש-`GET /` מתאים
- מריץ `validate` middleware
- מריץ `controller.getChart`

---

#### 4. `server/src/api/middleware/validate.middleware.ts`
```typescript
// בודק שהנתונים תקינים
const result = validators.getChartQuery.parse(req.query);
// { symbol: "BTC", range: "1D" } ✅
```
**מה קורה:** בודק ש-`symbol` קיים ו-`range` הוא '1D', '1W', או '1M'

---

#### 5. `server/src/api/controllers/chart.controller.ts` (שורה 15-49)
```typescript
export async function getChart(req, res) {
  const { symbol, range = '1D' } = req.query;
  // symbol = "BTC", range = "1D"
  
  const rangeConfig = rangeMap['1D'];
  // { timespan: 'day', limit: 30 }
  
  const chartData = await chartService.getChartData({
    symbol: "BTC",
    timespan: "day",
    limit: 30
  });
  
  res.json(successResponse(chartData));
}
```
**מה קורה:**
- מקבל את הנתונים מה-query
- ממיר `range` ל-`timespan` ו-`limit`
- קורא ל-service
- מחזיר תגובה

---

#### 6. `server/src/services/chart/chart.service.ts` (שורה 41-61)
```typescript
async getChartData(params) {
  const symbolType = detectSymbolType("BTC");
  // "crypto"
  
  const provider = this.getProvider("BTC");
  // CryptoChartProvider
  
  const [bars, quote] = await Promise.all([
    provider.getHistory({ symbol: "BTC", timespan: "day", limit: 30 }),
    provider.getQuote("BTC")
  ]);
  
  return {
    symbol: "BTC",
    type: "crypto",
    bars: [...],
    name: "Bitcoin"
  };
}
```
**מה קורה:**
- מזהה שזה קריפטו
- מוצא את ה-provider המתאים
- מביא נתונים במקביל

---

#### 7. `server/src/services/chart/symbol-detector.ts` (שורה 28-31)
```typescript
export function detectSymbolType(symbol: string): SymbolType {
  const upperSymbol = symbol.toUpperCase().trim();
  // "BTC"
  
  return SUPPORTED_CRYPTOS.includes(upperSymbol) ? 'crypto' : 'stock';
  // true → "crypto"
}
```
**מה קורה:** בודק אם "BTC" ברשימת הקריפטו

---

#### 8. `server/src/services/chart/providers/crypto-chart-provider.ts` (שורה 34-109)
```typescript
async getHistory(params) {
  // בודק cache
  const cached = getCached("crypto-history:BTC:day:30");
  if (cached) return cached;
  
  // קורא ל-API
  const response = await axios.get(
    "https://min-api.cryptocompare.com/data/v2/histoday",
    { params: { fsym: "BTC", tsym: "USD", limit: 30 } }
  );
  
  // ממיר לפורמט אחיד
  const bars = response.data.Data.Data.map(bar => ({
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volumefrom
  }));
  
  // שומר ב-cache
  setCache("crypto-history:BTC:day:30", bars);
  
  return bars;
}
```
**מה קורה:**
- בודק cache
- קורא ל-CryptoCompare API
- ממיר לפורמט אחיד
- שומר ב-cache

---

#### 9. חזרה דרך כל השכבות

הנתונים חוזרים דרך:
- Provider → Service → Controller → Response

---

#### 10. `server/src/api/controllers/chart.controller.ts` (שורה 41-45)
```typescript
res.status(HttpStatus.OK).json(successResponse(chartData, {
  symbol: chartData.symbol,
  type: chartData.type,
  barCount: chartData.bars.length,
}));
```
**מה קורה:** יוצר תגובה JSON ושולח חזרה

---

## 8. אזהרות וטעויות נפוצות

### ⚠️ איפה מפתחים מתחילים נוטים להתבלבל?

#### 1. **בלבול בין Controller ל-Service**

**הטעות:**
```typescript
// ❌ לוגיקה עסקית ב-controller
export async function getChart(req, res) {
  // 50 שורות של לוגיקה
  if (symbol === 'BTC') {
    // קוד לקריפטו
  } else {
    // קוד למניות
  }
  // ...
}
```

**הפתרון:**
```typescript
// ✅ Controller רק מנתב
export async function getChart(req, res) {
  const chartData = await chartService.getChartData(params);
  res.json(successResponse(chartData));
}
```

**למה זה חשוב:**
- Controller צריך להיות דק - רק קבלה ושליחה
- Service צריך להכיל את הלוגיקה
- קל לבדוק Service בלי HTTP

---

#### 2. **שינוי Provider בלי לשנות Interface**

**הטעות:**
```typescript
// ❌ מוסיף method חדש ב-provider
class StockChartProvider {
  async getHistory() { ... }
  async getQuote() { ... }
  async getNews() { ... }  // ← חדש, אבל לא ב-interface
}
```

**הבעיה:**
- Service לא יודע על ה-method החדש
- TypeScript לא יתריע
- קוד לא עקבי

**הפתרון:**
```typescript
// ✅ עדכן את ה-interface קודם
interface IChartProvider {
  getHistory(): Promise<HistoricalBar[]>;
  getQuote(): Promise<Quote>;
  getNews?(): Promise<News[]>;  // ← אופציונלי, אבל ב-interface
}
```

---

#### 3. **שימוש ישיר ב-API בלי Adapter**

**הטעות:**
```typescript
// ❌ Service קורא ישירות ל-API
async getChartData() {
  const response = await axios.get('https://api.polygon.io/...');
  // ממיר כאן
  return data;
}
```

**הבעיה:**
- אם Polygon משתנה, צריך לשנות את ה-Service
- קשה לבדוק (צריך mock את axios)
- קשה להוסיף API חדש

**הפתרון:**
```typescript
// ✅ Service קורא ל-Provider
async getChartData() {
  const provider = this.getProvider(symbol);
  return provider.getHistory(params);  // Provider מטפל ב-API
}
```

---

#### 4. **שכחת Cache Invalidation**

**הטעות:**
```typescript
// ❌ Cache לא מתעדכן
const cached = getCached(key);
if (cached) return cached;  // תמיד מחזיר את אותו דבר
```

**הבעיה:**
- נתונים ישנים
- משתמשים רואים מידע לא מעודכן

**הפתרון:**
```typescript
// ✅ TTL (Time To Live)
const cached = getCached(key);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data;  // רק אם לא פג תוקף
}
```

---

### 🔴 איזה חלקים הכי רגישים לשינויים?

#### 1. **Symbol Detector**

**למה רגיש:**
- אם משנים את הרשימה, כל ה-symbols משתנים
- אם מוסיפים קריטריון חדש, צריך לעדכן הכל

**איך להיזהר:**
- תמיד לבדוק את כל ה-providers אחרי שינוי
- להוסיף tests
- לתעד שינויים

---

#### 2. **Provider Interface**

**למה רגיש:**
- אם משנים את ה-interface, כל ה-providers צריכים עדכון
- אם מוסיפים parameter חדש, צריך לעדכן הכל

**איך להיזהר:**
- להוסיף parameters אופציונליים
- להשתמש ב-default values
- לעדכן את כל ה-providers יחד

---

#### 3. **Response Format**

**למה רגיש:**
- Frontend תלוי בפורמט
- אם משנים, Frontend נשבר

**איך להיזהר:**
- לא לשנות פורמט קיים
- להוסיף fields חדשים (backward compatible)
- לתעד שינויים

---

### 💡 טיפים למפתחים

#### 1. **תמיד לבדוק את ה-Logs**

```typescript
// הוסף logging
console.log(`📊 Chart Service: ${symbol} detected as ${symbolType}`);
```

**למה:**
- קל לראות מה קורה
- קל למצוא באגים
- קל להבין את הזרימה

---

#### 2. **תמיד לטפל בשגיאות**

```typescript
// ✅ טיפול בשגיאות
try {
  const data = await provider.getHistory(params);
  return data;
} catch (error) {
  console.error(`Error: ${error.message}`);
  return getMockHistory(params);  // Fallback
}
```

**למה:**
- API יכול להיכשל
- רשת יכולה להיכשל
- צריך fallback

---

#### 3. **תמיד לבדוק Types**

```typescript
// ✅ TypeScript בודק הכל
interface HistoricalBar {
  time: number;
  open: number;
  // ...
}
```

**למה:**
- מונע שגיאות בזמן ריצה
- קל למצוא בעיות
- קוד יותר בטוח

---

## סיכום

### המבנה הכללי:

```
HTTP Request
    ↓
Express (index.ts)
    ↓
Routes (api/routes/)
    ↓
Middleware (validation, auth)
    ↓
Controller (api/controllers/)
    ↓
Service (services/chart/)
    ↓
Provider (services/chart/providers/)
    ↓
External API
    ↓
Response
```

### עקרונות חשובים:

1. **הפרדת אחריות** - כל קובץ עושה דבר אחד
2. **Adapter Pattern** - כל API ממיר לפורמט אחיד
3. **Backend מחליט** - Frontend לא צריך לדעת פרטים
4. **Cache** - שיפור ביצועים
5. **Error Handling** - תמיד fallback

### איך להוסיף דברים חדשים:

1. **Provider חדש:** צור קובץ חדש ב-`providers/`, הוסף ל-service
2. **Endpoint חדש:** צור route, controller, validator
3. **Feature חדש:** הוסף ל-service או provider

---

**זה הכל!** עכשיו אתה מבין את כל הארכיטקטורה. אם יש שאלות - תשאל!

