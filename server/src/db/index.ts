import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as usersSchema from './schema/users';
import * as preferencesSchema from './schema/preferences';
import * as uploadsSchema from './schema/uploads';

// For query purposes
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema: {
    ...usersSchema,
    ...preferencesSchema,
    ...uploadsSchema,
  },
});

export * from './schema/users';
export * from './schema/preferences';
export * from './schema/uploads';

// Test connection
export async function testConnection() {
  try {
    await queryClient`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
