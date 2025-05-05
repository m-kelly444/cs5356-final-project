import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';

// Validation schema for registration data
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/register
 * 
 * Register a new user
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      // Return validation errors
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid input data',
            fields: Object.fromEntries(
              validation.error.issues.map(issue => [
                issue.path[0],
                issue.message,
              ])
            ),
          },
        },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validation.data;
    
    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User already exists',
            fields: {
              email: 'An account with this email already exists',
            },
          },
        },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const userId = createId();
    const now = Date.now();
    
    await db.insert(users).values({
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: 'user', // Default role
      createdAt: now,
      updatedAt: now,
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        role: 'user',
      },
    });
    
  } catch (error) {
    console.error('[API] Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred during registration',
        },
      },
      { status: 500 }
    );
  }
}