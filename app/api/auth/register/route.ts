import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';
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
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

    if (existingUser) {
      return new NextResponse(JSON.stringify({ 
        error: {
          message: 'Email already in use',
          fields: { email: 'This email is already registered' }
        }
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user using Drizzle syntax
    await db
      .insert(users)
      .values({
        id: createId(),
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: 'User registered successfully' 
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    return new NextResponse(JSON.stringify({ 
      success: false,
      error: { message: 'Internal server error' }
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 