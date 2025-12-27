# הסבר על מבנה ה-API: hooks/api vs lib/api

## סקירה כללית

בפרויקט יש הפרדה ברורה בין שתי שכבות של עבודה עם ה-API:

1. **`lib/api`** - שכבת ה-API הטהורה (Pure API Layer)
2. **`hooks/api`** - שכבת האינטגרציה עם React (React Integration Layer)

---

## 📁 lib/api - שכבת ה-API הטהורה

### מה זה?

`lib/api` מכיל פונקציות טהורות (pure functions) שקוראות ישירות לשרת באמצעות HTTP requests.

### מאפיינים:

- ✅ **לא תלוי ב-React** - יכול לעבוד גם מחוץ ל-React
- ✅ **פונקציות async פשוטות** - רק קריאות HTTP
- ✅ **ללא state management** - רק שולח בקשה ומחזיר תשובה
- ✅ **ללא caching** - כל קריאה = בקשה חדשה לשרת

### דוגמה:

```typescript
// lib/api/stocks.api.ts
export async function getStock(symbol: string): Promise<StockQuote> {
  const response = await apiClient.get(`/stocks/${symbol}`);
  return unwrapResponse(response.data);
}

// שימוש:
const stock = await stocksApi.getStock('AAPL');
```

### מתי להשתמש ב-`lib/api`?

- ✅ כשרוצים לקרוא ל-API מחוץ לקומפוננטות React
- ✅ כשרוצים קריאה חד-פעמית ללא caching
- ✅ בתוך ה-hooks עצמם (כפי שקורה ב-`hooks/api`)

---

## 🎣 hooks/api - שכבת האינטגרציה עם React

### מה זה?

`hooks/api` מכיל React Hooks (בדרך כלל React Query) שמעטפים את הפונקציות מ-`lib/api` ומספקים פונקציונליות React.

### מאפיינים:

- ✅ **תלוי ב-React** - רק בתוך קומפוננטות React
- ✅ **משתמש ב-React Query** - לניהול cache, loading states, errors
- ✅ **מנהל state** - isLoading, error, data, refetch
- ✅ **Caching אוטומטי** - לא צריך לבצע בקשות כפולות
- ✅ **Refetching אוטומטי** - יכול לעדכן את הנתונים אוטומטית

### דוגמה:

```typescript
// hooks/api/use-stocks.ts
export function useStock(symbol: string) {
  return useQuery({
    queryKey: ['stocks', symbol],
    queryFn: () => stocksApi.getStock(symbol), // משתמש ב-lib/api!
    staleTime: 60 * 1000, // Cache למשך דקה
    refetchInterval: 60 * 1000, // רענון כל דקה
  });
}

// שימוש בקומפוננטה:
function StockComponent() {
  const { data: stock, isLoading, error } = useStock('AAPL');
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  return <div>{stock.price}</div>;
}
```

### מתי להשתמש ב-`hooks/api`?

- ✅ **תמיד בקומפוננטות React** - זה המקום הנכון להשתמש
- ✅ כשרוצים caching אוטומטי
- ✅ כשרוצים loading states ו-error handling מובנה
- ✅ כשרוצים refetching אוטומטי

---

## 🏗️ איך זה עובד יחד?

```
┌─────────────────────────────────────────┐
│         React Component                 │
│                                         │
│  const { data } = useStock('AAPL')     │  ← hooks/api
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         hooks/api/use-stocks.ts         │
│                                         │
│  useQuery({                             │
│    queryFn: () => stocksApi.getStock() │  ← משתמש ב-lib/api
│  })                                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         lib/api/stocks.api.ts           │
│                                         │
│  async function getStock() {            │
│    return apiClient.get('/stocks/...') │  ← קריאת HTTP טהורה
│  }                                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
            Backend Server
```

---

## 📊 השוואה

| תכונה | lib/api | hooks/api |
|------|---------|-----------|
| **תלות ב-React** | ❌ לא | ✅ כן |
| **Caching** | ❌ לא | ✅ כן |
| **Loading states** | ❌ לא | ✅ כן |
| **Error handling** | ⚠️ בסיסי | ✅ מתקדם |
| **Refetching** | ❌ לא | ✅ כן |
| **שימוש בקומפוננטות** | ⚠️ אפשרי אבל לא מומלץ | ✅ מומלץ |
| **שימוש מחוץ ל-React** | ✅ כן | ❌ לא |

---

## 🎯 כללי אצבע

### ✅ עשה:
- **בקומפוננטות React**: השתמש תמיד ב-`hooks/api`
- **ב-hooks מותאמים אישית**: השתמש ב-`lib/api` אם צריך
- **בקוד שלא תלוי ב-React**: השתמש ב-`lib/api`

### ❌ אל תעשה:
- ❌ אל תקרא ישירות ל-`lib/api` מקומפוננטות React (אם יש hook זמין)
- ❌ אל תוסיף React Query logic ישירות ב-`lib/api`
- ❌ אל תוסיף HTTP calls ישירות ב-`hooks/api`

---

## 📝 דוגמאות מהקוד

### דוגמה 1: שימוש נכון בקומפוננטה

```typescript
// ✅ נכון - משתמש ב-hook
import { useStock } from '@/hooks/api';

function StockPrice({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStock(symbol);
  // ...
}
```

### דוגמה 2: ה-hook משתמש ב-lib/api

```typescript
// hooks/api/use-stocks.ts
import { stocksApi } from '../../lib/api'; // ✅ משתמש ב-lib/api

export function useStock(symbol: string) {
  return useQuery({
    queryKey: ['stocks', symbol],
    queryFn: () => stocksApi.getStock(symbol), // ✅ קורא לפונקציה מ-lib/api
  });
}
```

### דוגמה 3: שימוש ב-lib/api מחוץ ל-React

```typescript
// scripts/update-stocks.ts (לא React)
import { stocksApi } from '../lib/api'; // ✅ בסדר כי זה לא React

async function updateStocks() {
  const stocks = await stocksApi.getStocks(['AAPL', 'GOOGL']);
  // עיבוד נתונים...
}
```

---

## 🔍 סיכום

- **`lib/api`** = השכבה התחתונה: קריאות HTTP טהורות
- **`hooks/api`** = השכבה העליונה: אינטגרציה עם React ו-React Query
- **הפרדה זו** = קוד נקי, ניתן לבדיקה, וקל לתחזוקה

זהו pattern נפוץ ב-React שמאפשר:
- **Separation of Concerns** - הפרדת אחריות
- **Reusability** - `lib/api` יכול לשמש גם מחוץ ל-React
- **Testability** - קל לבדוק כל שכבה בנפרד
- **Maintainability** - שינויים בשכבה אחת לא משפיעים על השנייה

