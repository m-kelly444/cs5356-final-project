import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('Email already in use', { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await db.user.create({
      data: {
        id: uuidv4(), // If you use cuid(), replace this with cuid()
        name,
        email,
        password_hash: hashedPassword,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return new NextResponse('User registered successfully', { status: 201 });
  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
