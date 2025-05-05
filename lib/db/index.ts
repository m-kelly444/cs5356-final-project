// Database connection module
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Environment variables
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Check for required environment variables
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure SQLite client
// Local development will use a local SQLite file
// Production will use Turso or similar service
const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

// Initialize Drizzle ORM with the client and schema
export const db = drizzle(client, { schema });

// Function to initialize the database
export async function initDb() {
  // Here you could run migrations programmatically if needed
  console.log('Database initialized');
}

// Function to test the database connection
export async function testDbConnection() {
  try {
    // Try a simple query to test the connection
    const result = await db.select().from(schema.users).limit(1);
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Function to close the database connection
export async function closeDb() {
  try {
    await client.execute({ sql: 'PRAGMA optimize', args: [] });
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Export the schema for convenience
export { schema };