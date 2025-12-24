# ניתוח נקודות קצה (Endpoints) - Polygon vs Finnhub

## סיכום כללי

### Rate Limits:
- **Finnhub Free Tier**: 60 requests/minute
- **Polygon Free Tier**: 5 requests/minute (250 requests/day)

### עדכניות נתונים:
- **Finnhub**: מחיר נוכחי (real-time עם עיכוב 15 דקות ב-free tier)
- **Polygon**: נתונים של יום קודם (previous day)

---

## רשימת כל נקודות הקצה

### 1. מחיר מניה אחרון (Current Stock Quote)

#### Finnhub: `/quote`
```json
{
  "api": "Finnhub",
  "url": "https://finnhub.io/api/v1/quote",
  "purpose": "מחיר מניה נוכחי (current price)",
  "preferred": true,
  "reason": "עדיפות ברורה - מספק מחיר נוכחי (real-time עם עיכוב 15 דקות) לעומת Polygon שמספק רק יום קודם. בנוסף, Finnhub מאפשר 60 requests/minute לעומת 5 של Polygon. הנתונים יותר עדכניים והשימוש פשוט יותר.",
  "dataProvided": {
    "price": "מחיר נוכחי (c)",
    "change": "שינוי במחיר (d)",
    "changePercent": "אחוז שינוי (dp)",
    "volume": "לא זמין ב-endpoint זה"
  },
  "rateLimit": "60 requests/minute",
  "updateFrequency": "Real-time (עם עיכוב 15 דקות ב-free tier)"
}
```

#### Polygon: `/v2/aggs/ticker/{symbol}/prev`
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v2/aggs/ticker/{symbol}/prev",
  "purpose": "מחיר מניה של יום מסחר קודם (previous day)",
  "preferred": false,
  "reason": "פחות עדיף - מספק רק נתונים של יום קודם, לא מחיר נוכחי. Rate limit נמוך יותר (5 requests/minute). מתאים רק כגיבוי או כאשר אין צורך במחיר נוכחי.",
  "dataProvided": {
    "price": "מחיר סגירה יום קודם (c)",
    "open": "מחיר פתיחה (o)",
    "high": "גבוה (h)",
    "low": "נמוך (l)",
    "volume": "נפח (v)",
    "timestamp": "זמן (t)"
  },
  "rateLimit": "5 requests/minute (250/day)",
  "updateFrequency": "יום קודם בלבד"
}
```

---

### 2. מספר מניות בבת אחת (Multiple Stock Quotes)

#### Finnhub: אין endpoint ייעודי
```json
{
  "api": "Finnhub",
  "url": "N/A - צריך לעשות מספר בקשות ל-/quote",
  "purpose": "מספר מניות - אין endpoint ייעודי",
  "preferred": false,
  "reason": "פחות יעיל - צריך לעשות בקשה נפרדת לכל מניה. למרות ש-Finnhub מאפשר 60 requests/minute, זה עדיין פחות יעיל מאשר Polygon שמביא את כל המניות בבקשה אחת.",
  "dataProvided": "אותו כמו /quote, אבל צריך N בקשות",
  "rateLimit": "60 requests/minute (אבל צריך N בקשות)",
  "efficiency": "נמוכה - N בקשות עבור N מניות"
}
```

#### Polygon: `/v2/aggs/grouped/locale/us/market/stocks/{date}`
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}",
  "purpose": "כל המניות ביום מסחר אחד - בקשה אחת לכל המניות",
  "preferred": true,
  "reason": "עדיפות ברורה - בקשה אחת מביאה את כל המניות ביום אחד. מאוד יעיל כאשר צריך מספר מניות. למרות ש-rate limit נמוך יותר, היעילות גבוהה יותר כי בקשה אחת מספיקה.",
  "dataProvided": {
    "allStocks": "מערך עם כל המניות ביום המסוים",
    "perStock": {
      "symbol": "T",
      "price": "c (close)",
      "open": "o",
      "high": "h",
      "low": "l",
      "volume": "v"
    }
  },
  "rateLimit": "5 requests/minute (אבל בקשה אחת לכל המניות)",
  "efficiency": "גבוהה מאוד - בקשה אחת לכל המניות"
}
```

---

### 3. נתונים היסטוריים לגרפים (Historical Data / OHLC)

#### Finnhub: אין endpoint לנתונים היסטוריים
```json
{
  "api": "Finnhub",
  "url": "N/A - אין endpoint לנתונים היסטוריים",
  "purpose": "נתונים היסטוריים - לא זמין",
  "preferred": false,
  "reason": "לא זמין - Finnhub לא מספק endpoint לנתונים היסטוריים (OHLC bars) בגרסה החינמית. Polygon הוא האפשרות היחידה.",
  "dataProvided": "לא זמין",
  "rateLimit": "N/A"
}
```

#### Polygon: `/v2/aggs/ticker/{symbol}/range/1/{timespan}/{from}/{to}`
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/{timespan}/{from}/{to}",
  "purpose": "נתונים היסטוריים (OHLC bars) - יום/שבוע/חודש",
  "preferred": true,
  "reason": "עדיפות מוחלטת - זהו ה-API היחיד שמספק נתונים היסטוריים. תומך ב-pagination, מגוון timespans (day/week/month), ונתונים מותאמים (adjusted). חיוני לגרפים.",
  "dataProvided": {
    "bars": "מערך OHLC bars",
    "perBar": {
      "time": "t (timestamp)",
      "open": "o",
      "high": "h",
      "low": "l",
      "close": "c",
      "volume": "v"
    },
    "pagination": "next_url לתמיכה ב-pagination"
  },
  "rateLimit": "5 requests/minute (עם pagination עד 5 בקשות)",
  "timespans": ["day", "week", "month"],
  "features": ["pagination", "adjusted prices", "sorting"]
}
```

#### Polygon: `/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}` (Today's Data)
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}",
  "purpose": "נתוני היום (ניסיון לקבל נתונים של היום)",
  "preferred": true,
  "reason": "עדיפות - משמש להשלמת נתוני היום לגרפים. משמש יחד עם endpoint ההיסטורי כדי לקבל נתונים מלאים כולל היום.",
  "dataProvided": "אותו כמו endpoint ההיסטורי, אבל עבור תאריך ספציפי (היום)",
  "rateLimit": "5 requests/minute",
  "usage": "משולב עם endpoint ההיסטורי"
}
```

---

### 4. פרופיל חברה / פרטי מניה (Company Profile / Stock Details)

#### Finnhub: אין endpoint לפרופיל חברה
```json
{
  "api": "Finnhub",
  "url": "N/A - אין endpoint לפרופיל חברה",
  "purpose": "פרופיל חברה - לא זמין",
  "preferred": false,
  "reason": "לא זמין - Finnhub לא מספק endpoint לפרופיל חברה או פרטים נוספים על מניה. Polygon הוא האפשרות היחידה.",
  "dataProvided": "לא זמין"
}
```

#### Polygon: `/v3/reference/tickers/{symbol}`
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v3/reference/tickers/{symbol}",
  "purpose": "פרופיל חברה ופרטי מניה (שם, שווי שוק, בורסה וכו')",
  "preferred": true,
  "reason": "עדיפות מוחלטת - זהו ה-API היחיד שמספק פרטי חברה. כולל שם החברה, שווי שוק, בורסה, תיאור, ועוד. חיוני למידע מפורט על מניה.",
  "dataProvided": {
    "name": "שם החברה",
    "market_cap": "שווי שוק",
    "primary_exchange": "בורסה ראשית",
    "description": "תיאור החברה",
    "homepage_url": "אתר החברה",
    "total_employees": "מספר עובדים",
    "sic_code": "קוד SIC",
    "ticker": "סמל המניה"
  },
  "rateLimit": "5 requests/minute",
  "usage": "משולב עם /prev לקבלת פרטים מלאים"
}
```

---

### 5. חיפוש מניות (Stock Search)

#### Finnhub: אין endpoint לחיפוש
```json
{
  "api": "Finnhub",
  "url": "N/A - אין endpoint לחיפוש מניות",
  "purpose": "חיפוש מניות - לא זמין",
  "preferred": false,
  "reason": "לא זמין - Finnhub לא מספק endpoint לחיפוש מניות. Polygon הוא האפשרות היחידה.",
  "dataProvided": "לא זמין"
}
```

#### Polygon: `/v3/reference/tickers`
```json
{
  "api": "Polygon",
  "url": "https://api.polygon.io/v3/reference/tickers",
  "purpose": "חיפוש מניות לפי שם או סמל",
  "preferred": true,
  "reason": "עדיפות מוחלטת - זהו ה-API היחיד שמספק חיפוש מניות. תומך בחיפוש לפי שם או סמל, מסנן רק מניות פעילות, ומחזיר פרטים בסיסיים. חיוני לפונקציית חיפוש.",
  "dataProvided": {
    "results": "מערך תוצאות חיפוש",
    "perResult": {
      "ticker": "סמל המניה",
      "name": "שם החברה",
      "type": "סוג (Stock)",
      "primary_exchange": "בורסה",
      "market": "שוק"
    }
  },
  "rateLimit": "5 requests/minute",
  "parameters": {
    "search": "שאילתת חיפוש",
    "active": "true (רק מניות פעילות)",
    "limit": "מספר תוצאות",
    "market": "stocks"
  }
}
```

---

### 6. חדשות שוק (Market News)

#### Finnhub: `/news`
```json
{
  "api": "Finnhub",
  "url": "https://finnhub.io/api/v1/news",
  "purpose": "חדשות שוק לפי קטגוריה",
  "preferred": true,
  "reason": "עדיפות מוחלטת - Polygon לא מספק endpoint לחדשות. Finnhub מספק חדשות מעודכנות עם קטגוריות (general, forex, crypto, merger), תמיכה ב-pagination (minId), ונתונים מפורטים (headline, summary, source, url).",
  "dataProvided": {
    "news": "מערך חדשות",
    "perNews": {
      "id": "מזהה חדשה",
      "headline": "כותרת",
      "summary": "סיכום",
      "source": "מקור",
      "datetime": "תאריך ושעה",
      "url": "קישור",
      "related": "מניות קשורות (comma-separated)"
    }
  },
  "rateLimit": "60 requests/minute",
  "categories": ["general", "forex", "crypto", "merger"],
  "pagination": "minId parameter"
}
```

#### Polygon: אין endpoint לחדשות
```json
{
  "api": "Polygon",
  "url": "N/A - אין endpoint לחדשות",
  "purpose": "חדשות שוק - לא זמין",
  "preferred": false,
  "reason": "לא זמין - Polygon לא מספק endpoint לחדשות שוק. Finnhub הוא האפשרות היחידה.",
  "dataProvided": "לא זמין"
}
```

---

## סיכום השוואתי לפי סוג מידע

| סוג מידע | Finnhub | Polygon | העדיפה |
|---------|---------|---------|---------|
| **מחיר מניה נוכחי** | ✅ `/quote` (real-time) | ❌ `/prev` (יום קודם) | **Finnhub** |
| **מספר מניות בבת אחת** | ❌ אין (N בקשות) | ✅ `/grouped` (בקשה אחת) | **Polygon** |
| **נתונים היסטוריים** | ❌ אין | ✅ `/range` | **Polygon** |
| **פרופיל חברה** | ❌ אין | ✅ `/tickers/{symbol}` | **Polygon** |
| **חיפוש מניות** | ❌ אין | ✅ `/tickers` | **Polygon** |
| **חדשות שוק** | ✅ `/news` | ❌ אין | **Finnhub** |

---

## המלצות שימוש

### שימוש אופטימלי:

1. **מחיר נוכחי**: Finnhub `/quote` - עדכני יותר
2. **מספר מניות**: Polygon `/grouped` - יעיל יותר
3. **גרפים היסטוריים**: Polygon `/range` - האפשרות היחידה
4. **פרטי מניה**: Polygon `/tickers/{symbol}` - האפשרות היחידה
5. **חיפוש**: Polygon `/tickers` - האפשרות היחידה
6. **חדשות**: Finnhub `/news` - האפשרות היחידה

### אסטרטגיית Fallback:

- **מחיר נוכחי**: Finnhub ראשי → Polygon fallback (אם אין Finnhub API key)
- **מספר מניות**: Polygon ראשי (יעיל יותר) → Finnhub fallback (אם אין Polygon API key)
- **נתונים היסטוריים**: Polygon בלבד (אין חלופה)
- **חדשות**: Finnhub בלבד (אין חלופה)

---

## הערות חשובות

1. **Rate Limits**: 
   - Finnhub: 60 req/min - טוב יותר למחיר נוכחי
   - Polygon: 5 req/min - טוב יותר למספר מניות (בקשה אחת)

2. **עדכניות**:
   - Finnhub: Real-time (עם עיכוב 15 דקות)
   - Polygon: יום קודם בלבד

3. **חסרונות**:
   - Finnhub: אין נתונים היסטוריים, אין חיפוש, אין פרופיל
   - Polygon: אין חדשות, מחיר לא נוכחי

4. **שילוב אופטימלי**: 
   - השתמש ב-Finnhub למחיר נוכחי וחדשות
   - השתמש ב-Polygon לכל השאר (היסטורי, פרופיל, חיפוש, מספר מניות)

