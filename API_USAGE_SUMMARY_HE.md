# סיכום שימוש ב-APIs בפרויקט

## 1. Polygon.io (`POLYGON_API_KEY`)

### מה זה?
API למניות אמריקאיות - מספק נתוני מניות, נתונים היסטוריים, ומידע על חברות.

### מה אתה משתמש בו?

#### ✅ **מחירים מרובים (Multiple Stock Quotes)**
- **Endpoint**: `/v2/aggs/grouped/locale/us/market/stocks/{date}`
- **תפקיד**: מביא מחירים של **כל המניות בבקשה אחת** (יעיל מאוד!)
- **איפה בקוד**: `server/src/services/external-apis/polygon.service.ts` → `getMultipleStockQuotes()`
- **מתי משתמש**: 
  - WebSocket polling כל 2 דקות (עדכון כל המניות בבת אחת)
  - REST API endpoint `/api/stocks/defaults`
- **יתרון**: במקום N בקשות (אחת לכל מניה), עושה בקשה אחת!

#### ✅ **נתונים היסטוריים (Historical OHLC Data)**
- **Endpoint**: `/v2/aggs/ticker/{symbol}/range/1/{timespan}/{from}/{to}`
- **תפקיד**: נתונים היסטוריים לגרפים (Open, High, Low, Close, Volume)
- **איפה בקוד**: `polygon.service.ts` → `getStockHistory()`
- **מתי משתמש**: 
  - גרפים של מניות (`/api/chart?symbol=AAPL`)
  - תמיכה ב-timespans: day, week, month
- **יתרון**: Polygon הוא האפשרות היחידה לנתונים היסטוריים (Finnhub לא מספק)

#### ✅ **פרטי מניה (Stock Details)**
- **Endpoint**: `/v3/reference/tickers/{symbol}` + `/v2/aggs/ticker/{symbol}/prev`
- **תפקיד**: מידע מפורט על מניה (שם חברה, market cap, וכו')
- **איפה בקוד**: `polygon.service.ts` → `getStockDetails()`
- **מתי משתמש**: דף פרטי מניה

#### ✅ **חיפוש מניות (Stock Search)**
- **Endpoint**: `/v3/reference/tickers`
- **תפקיד**: חיפוש מניות לפי שם או סמל
- **איפה בקוד**: `polygon.service.ts` → `searchStocks()`
- **מתי משתמש**: רכיב `StockSearch` (חיפוש מניות ב-dashboard)

#### ✅ **גיבוי למחיר בודד (Fallback for Single Quote)**
- **Endpoint**: `/v2/aggs/ticker/{symbol}/prev`
- **תפקיד**: גיבוי אם Finnhub לא זמין (אבל Polygon נותן רק יום קודם, לא מחיר נוכחי)
- **איפה בקוד**: `stocks.controller.ts`, `portfolio.service.ts`

### מגבלות:
- ⚠️ **Rate Limit**: 5 בקשות לדקה (free tier)
- ⚠️ **תקופת נתונים**: רק נתוני יום קודם (לא real-time)
- ✅ **מימוש**: יש rate limiting חכם (15 שניות בין בקשות)

---

## 2. Finnhub (`FINNHUB_API_KEY`)

### מה זה?
API למניות וחדשות שוק - מספק מחירים עדכניים יותר מ-Polygon.

### מה אתה משתמש בו?

#### ✅ **מחיר נוכחי למניה בודדת (Real-time Stock Quote)**
- **Endpoint**: `/api/v1/quote`
- **תפקיד**: מחיר נוכחי של מניה (עדכני יותר מ-Polygon - real-time עם עיכוב 15 דקות)
- **איפה בקוד**: `server/src/services/external-apis/finnhub.service.ts` → `getStockQuote()`
- **מתי משתמש**: 
  - מחיר בודד למניה (`/api/stocks/:symbol`)
  - גרפים (מביא מחיר נוכחי לגרף)
  - Portfolio (חישוב ערך נוכחי)
- **יתרון**: עדכני יותר מ-Polygon (שנותן רק יום קודם)

#### ✅ **מחירים מרובים (Multiple Stock Quotes - Fallback)**
- **Endpoint**: `/api/v1/quote` (N פעמים)
- **תפקיד**: גיבוי אם Polygon לא זמין
- **איפה בקוד**: `finnhub.service.ts` → `getMultipleStockQuotes()`
- **מתי משתמש**: WebSocket polling - fallback אם Polygon נכשל
- **חסרון**: פחות יעיל מ-Polygon (צריך N בקשות במקום 1)

#### ✅ **חדשות שוק (Market News)**
- **Endpoint**: `/api/v1/news`
- **תפקיד**: חדשות שוק מעודכנות
- **איפה בקוד**: `finnhub.service.ts` → `getMarketNews()`
- **מתי משתמש**: 
  - רכיב `MarketNews` / `MarketNewsCarousel`
  - קטגוריות: general, forex, crypto, merger
- **יתרון**: Finnhub הוא האפשרות היחידה לחדשות (Polygon לא מספק)

### מגבלות:
- ⚠️ **Rate Limit**: 60 בקשות לדקה (free tier)
- ⚠️ **עיכוב נתונים**: 15 דקות ב-free tier
- ✅ **מימוש**: יש caching (15 דקות)

---

## 3. CryptoCompare (`CRYPTOCOMPARE_API_KEY`)

### מה זה?
API לקריפטו - מספק מחירים, נתונים סטטיסטיים, והיסטוריה של קריפטו.

### מה אתה משתמש בו?

#### ✅ **מחיר קריפטו בודד (Single Crypto Price)**
- **Endpoint**: `/data/pricemultifull`
- **תפקיד**: מחיר ונתונים של קריפטו אחד
- **איפה בקוד**: `server/src/services/external-apis/cryptocompare.service.ts` → `getCryptoPrice()`
- **נתונים שמחזיר**:
  - מחיר נוכחי
  - שינוי 24 שעות (mutlak ו-percent)
  - Market cap
  - Volume 24 שעות
  - High/Low 24 שעות
  - תמונה של המטבע

#### ✅ **מחירים מרובים (Multiple Crypto Prices)**
- **Endpoint**: `/data/pricemultifull` (עם כמה symbols)
- **תפקיד**: מחירים של כמה מטבעות קריפטו בבת אחת
- **איפה בקוד**: `cryptocompare.service.ts` → `getMultipleCryptoPrices()`
- **מתי משתמש**: 
  - WebSocket polling כל 30 שניות (עדכון כל הקריפטו)
  - רכיב `CryptoTicker`
  - REST API `/api/crypto`

#### ✅ **נתונים היסטוריים לגרפים (Historical Data for Charts)**
- **Endpoint**: `/data/v2/histoday`
- **תפקיד**: נתונים היסטוריים לגרפי קריפטו (OHLC)
- **איפה בקוד**: `server/src/services/chart/providers/crypto-chart-provider.ts`
- **מתי משתמש**: גרפים של קריפטו (`/api/chart?symbol=BTC`)

### מגבלות:
- ⚠️ **Rate Limit**: 100,000 קריאות בחודש (free tier)
- ✅ **מימוש**: יש caching (30 שניות)

---

## 4. Open Exchange Rates (`OPENEXCHANGERATES_APP_ID`)

### מה זה?
API לשערי חליפין - מספק שערי מטבעות יחסית ל-USD.

### מה אתה משתמש בו?

#### ✅ **שערי חליפין (Exchange Rates)**
- **Endpoint**: `/api/latest.json`
- **תפקיד**: רשימת כל שערי החליפין (base: USD)
- **איפה בקוד**: `server/src/services/external-apis/openexchange.service.ts` → `getExchangeRates()`
- **מתי משתמש**: 
  - REST API `/api/currencies/rates`
  - רכיב `CurrencyConverter`

#### ✅ **המרת מטבעות (Currency Conversion)**
- **Endpoint**: `/api/latest.json` (ואז חישוב מקומי)
- **תפקיד**: המרת סכום ממטבע אחד לאחר
- **איפה בקוד**: `openexchange.service.ts` → `convertCurrency()`
- **מתי משתמש**: רכיב `CurrencyConverter`

#### ✅ **זוגות מטבעות (Currency Pairs)**
- **Endpoint**: `/api/latest.json` (ואז חישוב מקומי)
- **תפקיד**: נתונים על כמה זוגות מטבעות בבת אחת
- **איפה בקוד**: `openexchange.service.ts` → `getCurrencyPairs()`

### מגבלות:
- ⚠️ **Rate Limit**: 1,000 קריאות בחודש (free tier)
- ✅ **מימוש**: יש caching ארוך (1 שעה) כי שערים לא משתנים לעיתים קרובות

---

## 5. Alpha Vantage (`ALPHA_VANTAGE_API_KEY`)

### מה זה?
API לנתוני פיננסיים - כאן משתמש בו רק ל-Forex (USD/ILS).

### מה אתה משתמש בו?

#### ✅ **נתונים תוך-יומיים (Intraday Forex Data)**
- **Endpoint**: `FX_INTRADAY` function
- **תפקיד**: נתונים תוך-יומיים של USD/ILS (5 דקות intervals)
- **איפה בקוד**: `server/src/services/external-apis/alphavantage.service.ts` → `getIntradayForex()`
- **מתי משתמש**: 
  - **WebSocket polling כל 5 דקות** - עדכון USD/ILS בזמן אמת
  - REST API `/api/currencies/intraday?from=USD&to=ILS`
- **נתונים**: עד 24 שעות אחרונות (288 נקודות של 5 דקות)

#### ✅ **נתונים יומיים (Daily Forex Data)**
- **Endpoint**: `FX_DAILY` function
- **תפקיד**: נתונים יומיים של USD/ILS (7 ימים אחרונים)
- **איפה בקוד**: `alphavantage.service.ts` → `getDailyForex()`
- **מתי משתמש**: 
  - REST API `/api/currencies/daily?from=USD&to=ILS`
  - גרפים שבועיים של USD/ILS

### מגבלות:
- ⚠️ **Rate Limit**: 5 בקשות לדקה (free tier)
- ⚠️ **מוגבל ל-USD/ILS**: משתמש רק בזוג הזה
- ✅ **מימוש**: יש rate limiting (12 שניות בין בקשות) + caching

### הערה חשובה:
Alpha Vantage משמש **רק ל-USD/ILS** ולעדכונים בזמן אמת (polling).
לגרפים היסטוריים של זוגות מטבע אחרים, משתמשים ב-**Twelve Data**.

---

## 6. Twelve Data (`TWELVE_DATA_API_KEY`)

### מה זה?
API לנתוני פיננסיים - כאן משתמש בו רק ל-Forex charts.

### מה אתה משתמש בו?

#### ✅ **נתונים היסטוריים של Forex (Forex Historical Charts)**
- **Endpoint**: `/time_series`
- **תפקיד**: נתונים היסטוריים (OHLC) לכל זוגות המטבעות
- **איפה בקוד**: `server/src/services/external-apis/twelvedata.service.ts` → `getForexHistory()`
- **מתי משתמש**: 
  - REST API `/api/chart/forex/:symbol?interval=1day`
  - גרפי Forex ב-frontend (מחפשים מטבעות כמו EUR, JPY, וכו')
- **Intervals נתמכים**: `1day`, `1week`
- **כמות נתונים**: עד 500 נקודות זמן

### הבדל מ-Alpha Vantage:
- **Alpha Vantage**: רק USD/ILS, עדכונים בזמן אמת (polling כל 5 דקות)
- **Twelve Data**: כל זוגות המטבעות, רק לגרפים היסטוריים (לא polling)

### מגבלות:
- ⚠️ **Rate Limit**: תלוי ב-plan (free tier מוגבל)
- ✅ **מימוש**: יש caching (5 דקות)

---

## סיכום - מי עושה מה?

| API | תחום | תפקיד ראשי | תפקיד משני |
|-----|------|------------|------------|
| **Polygon** | מניות | מחירים מרובים (בקשה אחת), היסטוריה, חיפוש | גיבוי למחיר בודד |
| **Finnhub** | מניות + חדשות | מחיר נוכחי (real-time), חדשות | גיבוי למחירים מרובים |
| **CryptoCompare** | קריפטו | הכל - מחירים, היסטוריה | - |
| **Open Exchange Rates** | מטבעות | שערי חליפין, המרות | - |
| **Alpha Vantage** | Forex (USD/ILS) | עדכונים בזמן אמת (polling) | - |
| **Twelve Data** | Forex (כל הזוגות) | גרפים היסטוריים | - |

## זרימת עבודה (Workflow)

### עדכון מניות (WebSocket):
1. **נסה Polygon** (`/grouped` - בקשה אחת לכל המניות) ✅ יעיל
2. **אם נכשל → Finnhub** (N בקשות, אחת לכל מניה)

### עדכון קריפטו (WebSocket):
- **CryptoCompare** בלבד (polling כל 30 שניות)

### עדכון Forex (WebSocket):
- **Alpha Vantage** בלבד (USD/ILS, polling כל 5 דקות)

### גרפים:
- **מניות**: Polygon (היסטוריה)
- **קריפטו**: CryptoCompare (היסטוריה)
- **Forex**: Twelve Data (היסטוריה של כל הזוגות)

### מחיר בודד:
- **מניות**: Finnhub ראשי → Polygon fallback
- **קריפטו**: CryptoCompare
- **Forex**: Alpha Vantage (USD/ILS) או Twelve Data (אחרים)

