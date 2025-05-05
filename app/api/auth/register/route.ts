import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2'; // Changed from uuid import
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user already exists using Drizzle syntax
    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase())) // Added toLowerCase for case-insensitive check
      .limit(1);
    
    const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

    if (existingUser) {
      return new NextResponse('Email already in use', { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user using Drizzle syntax
    await db
      .insert(schema.users)
      .values({
        id: createId(), // Using createId() instead of uuidv4()
        name,
        email: email.toLowerCase(), // Store email in lowercase
        passwordHash: hashedPassword, // Change to passwordHash to match schema
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return new NextResponse('User registered successfully', { status: 201 });
  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    // Add more detailed error logging
    console.error('[REGISTRATION_ERROR_DETAILS]', JSON.stringify(error, null, 2));
    return new NextResponse('Internal server error', { status: 500 });
  }
}