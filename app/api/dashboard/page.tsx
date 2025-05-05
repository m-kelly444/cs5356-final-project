// This is a placeholder for the API dashboard page
// It redirects to the actual dashboard page

import { redirect } from 'next/navigation';

export default function DashboardApiPage() {
  // Redirect to the actual dashboard page
  redirect('/dashboard');
}