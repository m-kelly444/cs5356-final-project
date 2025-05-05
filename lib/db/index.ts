import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm'; // Import the equality operator

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Find if user already exists using Drizzle syntax
    const existingUsers = await db
      .select()
      .from(schema.users) // Assuming your schema has a 'users' table
      .where(eq(schema.users.email, email))
      .limit(1);
    
    const existingUser = existingUsers[0];

    if (existingUser) {
      return new NextResponse('Email already in use', { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user using Drizzle syntax
    await db
      .insert(schema.users)
      .values({
        id: uuidv4(),
        name,
        email,
        password_hash: hashedPassword, // Make sure this matches your schema column name
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      });

    return new NextResponse('User registered successfully', { status: 201 });
  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}