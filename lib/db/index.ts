// lib/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Create the Drizzle ORM instance with Vercel Postgres
const db = drizzle(sql, { schema });

// Export both the database instance and schema
export { db, schema };