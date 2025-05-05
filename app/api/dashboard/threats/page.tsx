// This is a placeholder for the API threats page
// It redirects to the actual threats page

import { redirect } from 'next/navigation';

export default function ThreatsApiPage() {
  // Redirect to the actual threats page
  redirect('/dashboard/threats');
}