// scripts/migrate.ts
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from '../lib/db';

declare const process: {
  exit: (code: number) => never;
  env: {
    DATABASE_URL: string;
  };
};

// Run migrations
async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();