// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import 'dotenv/config'; // Ensure dotenv is loaded

// For debugging
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in the environment");
}

// Create the Neon client
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle ORM instance with Neon
const db = drizzle(sql, { schema });

// Export both the database instance and schema
export { db, schema };