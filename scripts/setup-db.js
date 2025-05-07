// scripts/setup-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Verify connection
    await prisma.$connect();
    console.log('Connected to database');
    
    // Create tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        "emailVerified" TIMESTAMP,
        image TEXT
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Threat" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        source TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Vulnerability" (
        id TEXT PRIMARY KEY,
        "cveId" TEXT UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        "cvssScore" DOUBLE PRECISION,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();