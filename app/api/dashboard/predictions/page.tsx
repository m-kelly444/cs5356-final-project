// This is a placeholder for the API predictions page
// It redirects to the actual predictions page

import { redirect } from 'next/navigation';

export default function PredictionsApiPage() {
  // Redirect to the actual predictions page
  redirect('/dashboard/predictions');
}