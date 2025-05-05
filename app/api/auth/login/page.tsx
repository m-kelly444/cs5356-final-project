// This file serves as a redirect for the login API endpoint.
// The actual API functionality is implemented in the route.ts file.

import { redirect } from 'next/navigation';

export default function LoginApiPage() {
  // Redirect to the login page
  redirect('/auth/login');
}