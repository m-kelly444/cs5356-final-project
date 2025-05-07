import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// Components
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import Footer from '@/components/layout/footer';

export const metadata = {
  title: 'Dashboard | CyberPulse',
  description: 'Real-time cybersecurity threat intelligence dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  // If not authenticated, redirect to login page
  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header user={session.user as { id: string; name: string; email: string; image?: string; role?: string }} />
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={session.user as { id: string; name: string; email: string; image?: string; role?: string }} />
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Cyberpunk effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        {/* Grid background */}
        <div className="absolute inset-0 cyber-grid opacity-10" />
        
        {/* Scanning line effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-blue-500 to-transparent opacity-30" style={{ animation: 'scan 8s linear infinite' }} />
      </div>
    </div>
  );
}