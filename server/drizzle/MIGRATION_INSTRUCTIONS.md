# מיגרציות ל-Supabase

## ⚠️ הערה חשובה

אם `npm run db:push` לא עובד (שגיאת driver), השתמש במיגרציה הידנית ב-Supabase SQL Editor - זה הפתרון המומלץ והבטוח יותר.

## אפשרות 1: מיגרציה מלאה (אם אין טבלאות קיימות)

אם זה מסד נתונים חדש, הרץ את המיגרציה המלאה:

**ב-Supabase SQL Editor:**
1. פתח את הקובץ `drizzle/0000_omniscient_leo.sql`
2. העתק את כל התוכן
3. הדבק ב-Supabase SQL Editor
4. לחץ **Run**

או נסה (אם זה עובד):
```bash
cd server
npm run db:push
```

## אפשרות 2: מיגרציה רק עבור Portfolio (אם יש כבר טבלאות אחרות)

אם יש לך כבר את הטבלאות `users`, `sessions`, `user_preferences`, `uploads`, הרץ רק את המיגרציה של Portfolio:

### שלב 1: צור את טבלת Portfolio

הרץ את הקובץ הבא ב-Supabase SQL Editor:

```sql
-- File: drizzle/migrations/0001_add_portfolio_table.sql
```

או העתק-הדבק את התוכן:

```sql
CREATE TABLE IF NOT EXISTS "portfolio" (
  "user_id" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "shares" NUMERIC(15, 4) NOT NULL,
  "average_price" NUMERIC(15, 4) NOT NULL,
  "current_price" NUMERIC(15, 4),
  "gain_loss" NUMERIC(15, 4),
  "gain_loss_percent" NUMERIC(10, 4),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "portfolio_user_id_symbol_pk" PRIMARY KEY("user_id", "symbol")
);

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'portfolio_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "portfolio" 
    ADD CONSTRAINT "portfolio_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE CASCADE;
  END IF;
END $$;
```

### שלב 2: הוסף אינדקסים

הרץ את הקובץ הבא:

```sql
-- File: drizzle/migrations/0002_add_portfolio_indexes.sql
```

או העתק-הדבק:

```sql
CREATE INDEX IF NOT EXISTS "portfolio_user_id_idx" ON "portfolio"("user_id");
CREATE INDEX IF NOT EXISTS "portfolio_symbol_idx" ON "portfolio"("symbol");
COMMENT ON TABLE "portfolio" IS 'User stock portfolio holdings with calculated gains/losses';
```

## איך להריץ ב-Supabase

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor**
4. העתק-הדבק את הקוד SQL מהמיגרציה
5. לחץ **Run** או `Ctrl+Enter`

## אימות שהמיגרציה הצליחה

הרץ את השאילתה הבאה כדי לבדוק שהטבלה נוצרה:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio'
ORDER BY ordinal_position;
```

אם הכל תקין, תראה את כל העמודות של טבלת portfolio.

## בעיות נפוצות

### שגיאה: "relation 'users' does not exist"
**פתרון**: ודא שהטבלה `users` קיימת לפני יצירת portfolio. הרץ את המיגרציה המלאה (`0000_omniscient_leo.sql`) במקום.

### שגיאה: "constraint already exists"
**פתרון**: זה בסדר - המיגרציה משתמשת ב-`IF NOT EXISTS` ו-`DO $$ BEGIN ... EXCEPTION`, אז היא בטוחה להרצה חוזרת.

### שגיאה: "permission denied"
**פתרון**: ודא שאתה משתמש ב-connection string של ה-database owner, לא של anon key.

