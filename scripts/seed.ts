import 'dotenv/config';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(users).values({
      id: createId(),
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'admin',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('✅ Created admin user: admin@example.com / password123');
    
    // Create test analyst user
    await db.insert(users).values({
      id: createId(),
      name: 'Analyst User',
      email: 'analyst@example.com',
      passwordHash: hashedPassword,
      role: 'analyst',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('✅ Created analyst user: analyst@example.com / password123');
    
    // Create regular test user
    await db.insert(users).values({
      id: createId(),
      name: 'Test User',
      email: 'user@example.com',
      passwordHash: hashedPassword,
      role: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('✅ Created regular user: user@example.com / password123');
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
