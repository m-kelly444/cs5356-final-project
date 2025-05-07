import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const { pathname } = request.nextUrl;
  
  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/auth/register', '/auth/error', '/'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Define protected paths
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Allow public paths or API routes
  if (isPublicPath || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Redirect to login if accessing protected path without auth
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Update matcher to include auth paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};