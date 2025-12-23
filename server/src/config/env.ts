import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),

  // API Keys
  POLYGON_API_KEY: z.string().optional(),
  CRYPTOCOMPARE_API_KEY: z.string().optional(),
  OPENEXCHANGERATES_APP_ID: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),

  // Supabase (optional)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // CORS
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  
  // In development, continue with defaults
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
}

export const env = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key-change-in-production',
  POLYGON_API_KEY: process.env.POLYGON_API_KEY || '',
  CRYPTOCOMPARE_API_KEY: process.env.CRYPTOCOMPARE_API_KEY || '',
  OPENEXCHANGERATES_APP_ID: process.env.OPENEXCHANGERATES_APP_ID || '',
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

export type Env = typeof env;

