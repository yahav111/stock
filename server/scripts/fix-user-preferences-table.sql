-- Fix user_preferences table - Add missing columns
-- Run this in Supabase SQL Editor

-- Add default_chart column if it doesn't exist
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS default_chart VARCHAR(20) DEFAULT 'candlestick';

-- Add default_timeframe column if it doesn't exist
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS default_timeframe VARCHAR(10) DEFAULT '1D';

-- Verify the table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

