import { NextAuthOptions } from 'next-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { ExtendedJWT, ExtendedSession, User, UserRole } from '@/types/auth';

export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    // Credentials provider allows username/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      // Authorization logic
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Find user by email
          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toLowerCase()));
          
          const user = userResults[0];
          
          // If user not found, return null
          if (!user) {
            return null;
          }
          
          // Check if we have a password hash - now using user.passwordHash
          if (!user.passwordHash || typeof user.passwordHash !== 'string') {
            console.error('Invalid password hash format:', typeof user.passwordHash);
            return null;
          }
          
          // Compare password with stored hash - now using user.passwordHash
          const passwordMatch = await bcrypt.compare(
            credentials.password.toString(),
            user.passwordHash
          );
          
          // If password doesn't match, return null
          if (!passwordMatch) {
            return null;
          }
          
          // Return user object (without password)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
    
    // Add more providers here as needed (Google, GitHub, etc.)
  ],
  
  // Configure session handling
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // Pages configurations - UPDATED
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  
  // Callbacks to extend default behavior
  callbacks: {
    // Modify the JWT token
    jwt: async ({ token, user }) => {
      const extendedToken = token as ExtendedJWT;
      
      // Add custom fields from user to token
      if (user) {
        extendedToken.id = user.id as string;
        extendedToken.role = (user as User).role;
      }
      
      return extendedToken;
    },
    
    // Modify the session
    session: async ({ session, token }) => {
      const extendedToken = token as ExtendedJWT;
      const extendedSession = session as ExtendedSession;
      
      // Transfer custom fields from token to session
      if (extendedToken) {
        extendedSession.user.id = extendedToken.id;
        extendedSession.user.role = extendedToken.role;
      }
      
      return extendedSession;
    },
  },
  
  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
  
  // Secret for signing tokens
  secret: process.env.NEXTAUTH_SECRET,
};