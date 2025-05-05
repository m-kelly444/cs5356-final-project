// Database connection module
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Initialize Drizzle ORM with the Vercel Postgres client and schema
export const db = drizzle(sql, { schema });

// Function to initialize the database
export async function initDb() {
  // Here you could run migrations programmatically if needed
  console.log('Database initialized');
}

// Function to test the database connection
export async function testDbConnection() {
  try {
    // Try a simple query to test the connection
    const result = await sql`SELECT NOW()`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export the schema for convenience
export { schema };