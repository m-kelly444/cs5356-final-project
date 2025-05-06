import { NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';

// API route for custom login logic
// Note: This would typically be handled by NextAuth's [...nextauth] route
// This is here for any custom login behavior needed outside of NextAuth

export async function POST(req: Request) {
  try {
    // Our authentication is handled by NextAuth
    // This route can be used for any additional login functionality
    // such as logging login attempts, etc.
    
    return NextResponse.json({ 
      message: 'Please use NextAuth endpoint for authentication'
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}