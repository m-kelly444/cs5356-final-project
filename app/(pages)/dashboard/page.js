import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';
import DashboardClient from './DashboardClient';
import { Loader } from '@/components/ui/loader';

export const metadata = {
  title: 'Threats | CyberPulse',
  description: 'Cybersecurity threat overview',
};

export default async function DashboardPage() {
  // Server-side auth check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader size="lg" /></div>}>
      <DashboardClient />
    </Suspense>
  );
}
