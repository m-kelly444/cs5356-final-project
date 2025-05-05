import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Initialize NextAuth.js
const handler = NextAuth(authOptions);

// Export handler for both GET and POST methods
export { handler as GET, handler as POST };