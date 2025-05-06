import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql', // This was missing
  driver: 'pg',          // This should be fine
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;