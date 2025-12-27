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

