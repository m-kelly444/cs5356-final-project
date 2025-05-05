// This file serves as a redirect for the registration API endpoint.
// The actual API functionality is implemented in the route.ts file.

import { redirect } from 'next/navigation';

export default function RegisterApiPage() {
  // Redirect to the registration page
  redirect('/auth/register');
}