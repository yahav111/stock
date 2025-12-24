-- Migration: Add portfolio table
-- Created: 2024-12-25
-- Description: Creates the portfolio table for user stock holdings

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

-- Add foreign key constraint to users table
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "portfolio_user_id_idx" ON "portfolio"("user_id");

-- Create index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS "portfolio_symbol_idx" ON "portfolio"("symbol");

-- Add comment to table
COMMENT ON TABLE "portfolio" IS 'User stock portfolio holdings with calculated gains/losses';

