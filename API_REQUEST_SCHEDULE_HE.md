# לוח זמנים של בקשות API - מתי השרת קורא לכל API

## 📅 בקשות מתוזמנות (Scheduled - WebSocket Polling)

### 1. **Polygon.io** - מניות מרובות
- **תדירות**: כל **2 דקות** (120,000ms) ⚠️ **לא אופטימלי!**
- **פונקציה**: `getMultipleStockQuotes()`
- **Endpoint**: `/v2/aggs/grouped/locale/us/market/stocks/{date}`
- **מה זה עושה**: מביא מחירים של **כל המניות המנויות** בבקשה אחת
- **איפה בקוד**: `server/src/websocket/index.ts` → שורה 268
- **הערות**:
  - בקשה אחת לכל המניות (יעיל מאוד!)
  - מביא נתונים של יום קודם (לא real-time)
  - ⚠️ **בעיה**: אם הנתונים של יום קודם, אין טעם לעדכן כל 2 דקות - הם לא ישתנו עד למחר!
  - ✅ **Cache עוזר**: אם כל המניות ב-cache (TTL 2 דקות), הוא לא קורא ל-API
  - 💡 **המלצה**: להאריך polling ל-1 שעה או יותר, או להעדיף Finnhub שמביא נתונים נוכחיים
  - אם נכשל → fallback ל-Finnhub

### 2. **Finnhub** - מניות מרובות (Fallback)
- **תדירות**: כל **2 דקות** (רק אם Polygon נכשל)
- **פונקציה**: `getMultipleStockQuotes()`
- **Endpoint**: `/api/v1/quote` (N פעמים - אחת לכל מניה)
- **מה זה עושה**: מביא מחירים נוכחיים של כל המניות (N בקשות)
- **איפה בקוד**: `server/src/websocket/index.ts` → שורות 226-237
- **הערות**:
  - פחות יעיל מ-Polygon (צריך N בקשות)
  - אבל עדכני יותר (real-time עם עיכוב 15 דקות)

### 3. **CryptoCompare** - קריפטו מרובה
- **תדירות**: כל **30 שניות** (30,000ms)
- **פונקציה**: `getMultipleCryptoPrices()`
- **Endpoint**: `/data/pricemultifull`
- **מה זה עושה**: מביא מחירים של **כל המטבעות הקריפטו המנויים** בבת אחת
- **איפה בקוד**: `server/src/websocket/index.ts` → שורה 296
- **הערות**:
  - תדירות גבוהה כי קריפטו משתנה מהר
  - CryptoCompare מאפשר 100K קריאות בחודש (יותר גמיש)

### 4. **Alpha Vantage** - Forex USD/ILS (Intraday)
- **תדירות**: כל **5 דקות** (300,000ms)
- **פונקציה**: `getIntradayForex('USD', 'ILS', '5min')`
- **Endpoint**: `FX_INTRADAY` function
- **מה זה עושה**: מביא נתונים תוך-יומיים של USD/ILS (24 שעות אחרונות, 5 דקות intervals)
- **איפה בקוד**: `server/src/websocket/index.ts` → שורה 337
- **הערות**:
  - רק USD/ILS (לא זוגות אחרים)
  - משמש ל-polling בזמן אמת
  - יש גם initialization פעם אחת בהתחלה (שורה 118)

---

## 🔄 בקשות לפי דרישה (On-Demand - REST API)

בקשות אלה נקראות רק כאשר המשתמש מבקש אותן דרך ה-REST API.

### 1. **Polygon.io**

#### `/api/stocks/:symbol` - מחיר מניה בודדת (Fallback)
- **מתי**: כש-Finnhub לא זמין או נכשל
- **פונקציה**: `getStockQuote()`
- **Endpoint**: `/v2/aggs/ticker/{symbol}/prev`
- **Cache TTL**: 2 דקות
- **Rate Limiting**: 15 שניות בין בקשות

#### `/api/stocks` או `/api/stocks/defaults` - מניות מרובות
- **מתי**: כשמשתמש מבקש מספר מניות דרך REST API
- **פונקציה**: `getMultipleStockQuotes()`
- **Endpoint**: `/v2/aggs/grouped/locale/us/market/stocks/{date}`
- **Cache TTL**: 2 דקות (לכל מניה בנפרד)

#### `/api/stocks/:symbol/history` - נתונים היסטוריים
- **מתי**: כשמשתמש מבקש גרף היסטורי של מניה
- **פונקציה**: `getStockHistory()`
- **Endpoint**: `/v2/aggs/ticker/{symbol}/range/1/{timespan}/{from}/{to}`
- **Cache TTL**: 1 שעה
- **Rate Limiting**: 15 שניות בין בקשות

#### `/api/stocks/:symbol/details` - פרטי מניה
- **מתי**: כשמשתמש מבקש פרטים מפורטים על מניה
- **פונקציה**: `getStockDetails()`
- **Endpoints**: 
  - `/v3/reference/tickers/{symbol}`
  - `/v2/aggs/ticker/{symbol}/prev`
- **Cache TTL**: 2 דקות

#### `/api/stocks/search?q=...` - חיפוש מניות
- **מתי**: כשמשתמש מחפש מניות
- **פונקציה**: `searchStocks()`
- **Endpoint**: `/v3/reference/tickers`
- **Rate Limiting**: 15 שניות בין בקשות

---

### 2. **Finnhub**

#### `/api/stocks/:symbol` - מחיר מניה בודדת (ראשי)
- **מתי**: כשמשתמש מבקש מחיר של מניה בודדת
- **פונקציה**: `getStockQuote()`
- **Endpoint**: `/api/v1/quote`
- **Cache TTL**: 15 דקות
- **יתרון**: עדכני יותר מ-Polygon (real-time עם עיכוב 15 דקות)

#### `/api/news` - חדשות שוק
- **מתי**: כשמשתמש מבקש חדשות שוק
- **פונקציה**: `getMarketNews()`
- **Endpoint**: `/api/v1/news`
- **Cache TTL**: 2 דקות
- **Query Params**: 
  - `category`: general, forex, crypto, merger
  - `minId`: pagination

---

### 3. **CryptoCompare**

#### `/api/crypto/:symbol` - מחיר קריפטו בודד
- **מתי**: כשמשתמש מבקש מחיר של מטבע קריפטו אחד
- **פונקציה**: `getCryptoPrice()`
- **Endpoint**: `/data/pricemultifull`
- **Cache TTL**: 30 שניות

#### `/api/crypto` או `/api/crypto/defaults` - קריפטו מרובה
- **מתי**: כשמשתמש מבקש מספר מטבעות קריפטו דרך REST API
- **פונקציה**: `getMultipleCryptoPrices()`
- **Endpoint**: `/data/pricemultifull`
- **Cache TTL**: 30 שניות

#### גרפים היסטוריים (Chart API)
- **מתי**: כשמשתמש מבקש גרף היסטורי של קריפטו
- **פונקציה**: `getHistory()` (בתוך `crypto-chart-provider.ts`)
- **Endpoint**: `/data/v2/histoday`
- **Cache TTL**: 1 שעה

---

### 4. **Open Exchange Rates**

#### `/api/currencies/rates` - שערי חליפין
- **מתי**: כשמשתמש מבקש רשימת שערי חליפין
- **פונקציה**: `getExchangeRates()`
- **Endpoint**: `/api/latest.json`
- **Cache TTL**: 1 שעה (שערים לא משתנים לעיתים קרובות)

#### `/api/currencies/convert` - המרת מטבע
- **מתי**: כשמשתמש מבקש להמיר סכום ממטבע אחד לאחר
- **פונקציה**: `convertCurrency()`
- **Endpoint**: `/api/latest.json` (ואז חישוב מקומי)
- **Cache TTL**: 1 שעה

#### `/api/currencies/pairs` - זוגות מטבעות
- **מתי**: כשמשתמש מבקש כמה זוגות מטבעות
- **פונקציה**: `getCurrencyPairs()`
- **Endpoint**: `/api/latest.json` (ואז חישוב מקומי)
- **Cache TTL**: 1 שעה

---

### 5. **Alpha Vantage** (Forex USD/ILS)

#### `/api/currencies/forex/intraday?from=USD&to=ILS` - נתונים תוך-יומיים
- **מתי**: כשמשתמש מבקש גרף תוך-יומי של USD/ILS
- **פונקציה**: `getIntradayForex()`
- **Endpoint**: `FX_INTRADAY` function
- **Cache**: יש in-memory cache (dailyCache) - מתעדכן כל 5 דקות ב-WebSocket
- **Rate Limiting**: 12 שניות בין בקשות
- **נתונים**: עד 24 שעות אחרונות, 5 דקות intervals

#### `/api/currencies/forex/daily?from=USD&to=ILS` - נתונים יומיים
- **מתי**: כשמשתמש מבקש גרף יומי של USD/ILS (7 ימים)
- **פונקציה**: `getDailyForex()`
- **Endpoint**: `FX_DAILY` function
- **Rate Limiting**: 12 שניות בין בקשות
- **נתונים**: 7 ימים אחרונים

---

### 6. **Twelve Data** (Forex Charts)

#### `/api/chart/forex/:symbol?interval=1day` - גרפים היסטוריים של Forex
- **מתי**: כשמשתמש מבקש גרף היסטורי של זוג מטבעות (לא רק USD/ILS)
- **פונקציה**: `getForexHistory()`
- **Endpoint**: `/time_series`
- **Cache TTL**: 5 דקות
- **Intervals**: `1day`, `1week`
- **נתונים**: עד 500 נקודות זמן
- **הערה**: משמש רק לגרפים היסטוריים, לא ל-polling

---

## 📊 סיכום - טבלת זמנים

| API | תדירות Scheduled | תדירות On-Demand | Cache TTL | Rate Limiting |
|-----|-------------------|-------------------|-----------|---------------|
| **Polygon** | כל 2 דקות (מניות מרובות) | לפי בקשות משתמש | 2 דקות / 1 שעה (היסטוריה) | 15 שניות |
| **Finnhub** | כל 2 דקות (fallback) | לפי בקשות משתמש | 15 דקות / 2 דקות (חדשות) | - |
| **CryptoCompare** | כל 30 שניות | לפי בקשות משתמש | 30 שניות / 1 שעה (גרפים) | - |
| **Open Exchange Rates** | - | לפי בקשות משתמש | 1 שעה | - |
| **Alpha Vantage** | כל 5 דקות (USD/ILS) | לפי בקשות משתמש | In-memory cache | 12 שניות |
| **Twelve Data** | - | לפי בקשות משתמש | 5 דקות | - |

---

## 🔍 הערות חשובות

### Scheduled Polling:
1. **Polling מתחיל רק אם יש clients מחוברים** (`if (clients.size === 0) return`)
2. **Stocks**: Polygon ראשי → Finnhub fallback
3. **Crypto**: CryptoCompare בלבד (תדירות גבוהה - 30 שניות)
4. **Forex**: Alpha Vantage בלבד (USD/ILS, כל 5 דקות)

### On-Demand (REST API):
1. **כל בקשה נבדקת נגד cache קודם**
2. **אם יש cache תקף → מחזיר מיד (ללא קריאה ל-API)**
3. **אם אין cache או שהוא expired → קורא ל-API**
4. **Rate limiting מופעל לפני קריאות ל-Polygon ו-Alpha Vantage**

### Cache Strategy:
- **Cache קצר (30 שניות - 2 דקות)**: נתונים שמשתנים מהר (מחירים, חדשות)
- **Cache בינוני (5-15 דקות)**: נתונים שמשתנים פחות (מחירים יומיים)
- **Cache ארוך (1 שעה)**: נתונים כמעט סטטיים (היסטוריה, שערי חליפין)

---

## ❓ שאלות נפוצות

### Q: למה לעדכן Polygon כל 2 דקות אם הוא מביא נתונים של יום קודם?
**A**: ⚠️ **שאלה מצוינת - זה לא אופטימלי!**
- אם Polygon מביא נתונים של יום קודם, הם לא ישתנו עד למחר
- אז אין טעם לעדכן כל 2 דקות
- **למה זה עובד כרגע**: יש cache של 2 דקות, אז אחרי הקריאה הראשונה, ה-cache נשאר ואז לא קוראים ל-API שוב (אם כל המניות ב-cache)
- **למה זה עדיין לא טוב**: אחרי 2 דקות ה-cache expires, ואז קוראים שוב ל-API ומביאים את אותם נתונים
- **פתרון מומלץ**: 
  1. להאריך polling ל-1 שעה או יותר (או עד למחר)
  2. או להעדיף Finnhub שמביא נתונים נוכחיים (אבל זה פחות יעיל - N בקשות)
  3. או לבדוק בתאריך אם היום השתנה לפני קריאה ל-API

### Q: למה CryptoCompare כל 30 שניות אבל Polygon כל 2 דקות?
**A**: 
- CryptoCompare מאפשר 100K קריאות בחודש (יותר גמיש)
- קריפטו משתנה מהר יותר ממניות
- Polygon מוגבל ל-5 בקשות לדקה
- **אבל**: CryptoCompare מביא נתונים נוכחיים, בעוד Polygon מביא נתונים של יום קודם

### Q: למה Alpha Vantage רק USD/ILS?
**A**: 
- Alpha Vantage משמש רק ל-polling בזמן אמת
- לגרפים היסטוריים של זוגות אחרים משתמשים ב-Twelve Data

### Q: מה קורה אם API נכשל?
**A**:
- **Scheduled**: 
  - Stocks: Polygon נכשל → fallback ל-Finnhub
  - Crypto/Forex: מחזיר cached data או mock data
- **On-Demand**: מחזיר error ל-client

### Q: כמה בקשות ביום זה יוצר?
**A** (בערך):
- **Polygon**: ~720 בקשות ביום (כל 2 דקות)
- **Finnhub**: ~720 בקשות ביום (אם Polygon נכשל) + בקשות on-demand
- **CryptoCompare**: ~2,880 בקשות ביום (כל 30 שניות)
- **Alpha Vantage**: ~288 בקשות ביום (כל 5 דקות)
- **Open Exchange Rates**: רק on-demand (מאוד נמוך)
- **Twelve Data**: רק on-demand (תלוי בשימוש)

---

## 🎯 המלצות

1. **Polygon**: ⚠️ הקצב הנוכחי (כל 2 דקות) **לא אופטימלי** - מביא נתונים של יום קודם שלא משתנים
   - 💡 **מומלץ**: להאריך ל-1 שעה או יותר (או עד למחר)
   - 💡 **אלטרנטיבה**: להעדיף Finnhub שמביא נתונים נוכחיים (אבל פחות יעיל)
   - Rate limit בטוח: 5 בקשות/דקה = מקסימום 300/שעה

2. **CryptoCompare**: 2,880/יום = ~96/שעה - בטוח (100K/חודש)
   - ✅ הגיוני כי מביא נתונים נוכחיים שמשתנים

3. **Alpha Vantage**: 288/יום = ~12/שעה - בטוח (5/דקה = מקסימום 300/שעה)
   - ✅ הגיוני כי מביא נתונים נוכחיים של USD/ILS

4. **Finnhub**: רק fallback + on-demand - בטוח (60/דקה)
   - ✅ מביא נתונים נוכחיים - הגיוני לעדכן כל 2 דקות

5. **Open Exchange Rates**: רק on-demand - בטוח מאוד (1K/חודש)

6. **Twelve Data**: רק on-demand - תלוי בשימוש

