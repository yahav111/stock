# 🚀 מיגרציה מהירה ל-Supabase - Portfolio Table

## השלבים:

### 1. היכנס ל-Supabase Dashboard
- לך ל: https://supabase.com/dashboard
- בחר את הפרויקט שלך

### 2. פתח SQL Editor
- בתפריט השמאלי, לחץ על **SQL Editor**
- לחץ על **New query**

### 3. העתק והדבק את הקוד הבא:

```sql
-- Create portfolio table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "portfolio_user_id_idx" ON "portfolio"("user_id");
CREATE INDEX IF NOT EXISTS "portfolio_symbol_idx" ON "portfolio"("symbol");

-- Add comment
COMMENT ON TABLE "portfolio" IS 'User stock portfolio holdings with calculated gains/losses';
```

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
WHERE table_name = 'portfolio'
ORDER BY ordinal_position;
```

אם תראה 9 שורות (עמודות), הכל עבד! ✅

## 🎉 סיימת!

עכשיו אתה יכול להשתמש במערכת Portfolio!

