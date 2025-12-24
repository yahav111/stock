/**
 * Script to run portfolio migration manually
 * Usage: tsx scripts/run-portfolio-migration.ts
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('📦 Connecting to database...');
  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../drizzle/migrations/0001_add_portfolio_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Running portfolio migration...');
    console.log('   File: drizzle/migrations/0001_add_portfolio_table.sql');
    
    // Execute migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'portfolio'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Portfolio table verified - exists in database');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'portfolio'
        ORDER BY ordinal_position
      `;
      
      console.log(`✅ Found ${columns.length} columns in portfolio table:`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.error('❌ Portfolio table not found after migration');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Table might already exist - this is OK');
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

runMigration();

