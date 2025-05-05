import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
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
      .where(eq(schema.users.email, email))
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
        id: uuidv4(),
        name,
        email,
        password: hashedPassword, // Changed from passwordHash to match database column name
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return new NextResponse('User registered successfully', { status: 201 });
  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}