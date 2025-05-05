const { db } = require('../lib/db');
const { users } = require('../lib/db/schema');
const bcrypt = require('bcryptjs');
const { createId } = require('@paralleldrive/cuid2');

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await db.insert(users).values({
    id: createId(),
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: hashedPassword,
    role: 'admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  console.log('Test user created successfully');
}

createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creating test user:', error);
    process.exit(1);
  });