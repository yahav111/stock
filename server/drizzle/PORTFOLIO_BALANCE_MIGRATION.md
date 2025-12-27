# 🚀 מיגרציה מהירה ל-Supabase - Portfolio Balance Table

## השלבים:

### 1. היכנס ל-Supabase Dashboard
- לך ל: https://supabase.com/dashboard
- בחר את הפרויקט שלך

### 2. פתח SQL Editor
- בתפריט השמאלי, לחץ על **SQL Editor**
- לחץ על **New query**

### 3. העתק והדבק את הקוד הבא:

```sql
-- Create portfolio_balance table
CREATE TABLE IF NOT EXISTS "portfolio_balance" (
  "user_id" TEXT NOT NULL,
  "initial_cash" NUMERIC(15, 2) NOT NULL DEFAULT '0',
  "cash" NUMERIC(15, 2) NOT NULL DEFAULT '0',
  "invested" NUMERIC(15, 2) NOT NULL DEFAULT '0',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "portfolio_balance_user_id_unique" UNIQUE("user_id")
);

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'portfolio_balance_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "portfolio_balance" 
    ADD CONSTRAINT "portfolio_balance_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS "portfolio_balance_user_id_idx" ON "portfolio_balance"("user_id");

-- Add comment
COMMENT ON TABLE "portfolio_balance" IS 'User portfolio cash and invested amounts tracking';


### 4. הרץ את השאילתה
- לחץ על **Run** (או `Ctrl+Enter` / `Cmd+Enter`)

### 5. אימות
הרץ את השאילתה הבאה כדי לבדוק שהטבלה נוצרה:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'portfolio_balance'
ORDER BY ordinal_position;
```

אם תראה 7 שורות (עמודות), הכל עבד! ✅

## 🎉 סיימת!

עכשיו אתה יכול להשתמש במערכת Portfolio עם ניהול cash/invested!

## הערות חשובות:

1. **Initial Cash**: המשתמש צריך להגדיר את הסכום ההתחלתי דרך ה-UI
2. **Cash**: מתעדכן אוטומטית בעת הוספה/מחיקה/עדכון מניות
3. **Invested**: מחושב אוטומטית מכל המניות בתיק
4. **Gain/Loss**: מחושב רק על הסכום המושקע, לא כולל cash

