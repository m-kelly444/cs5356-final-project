import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';
import RegisterForm from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Register | CyberPulse',
  description: 'Create a new CyberPulse account',
};

export default async function RegisterPage() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  // If already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight neon-text mb-6">
            CyberPulse
          </h1>
          <h2 className="text-2xl font-bold mb-2">
            Create an account
          </h2>
          <p className="text-gray-400">
            Join our cybersecurity intelligence platform
          </p>
        </div>
        
        {/* Registration form */}
        <div className="cyber-card p-6">
          <RegisterForm />
        </div>
        
        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-80" />
        
        {/* Grid lines */}
        <div className="absolute inset-0 cyber-grid opacity-20" />
        
        {/* Animated cyberpunk lines */}
        <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Horizontal lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line 
              key={`h-${i}`}
              x1="0" 
              y1={`${(i + 1) * 20}%`} 
              x2="100%" 
              y2={`${(i + 1) * 20}%`}
              stroke="fuchsia" 
              strokeWidth="1" 
              strokeDasharray="10,30,60" 
              strokeDashoffset={i * 37}
              filter="url(#glow)"
            >
              <animate 
                attributeName="stroke-dashoffset" 
                values={`${i * 100};${i * -100}`} 
                dur={`${20 + i * 5}s`} 
                repeatCount="indefinite" 
              />
            </line>
          ))}
          
          {/* Vertical lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line 
              key={`v-${i}`}
              x1={`${(i + 1) * 20}%`} 
              y1="0" 
              x2={`${(i + 1) * 20}%`} 
              y2="100%"
              stroke="cyan" 
              strokeWidth="1" 
              strokeDasharray="20,40,5" 
              strokeDashoffset={i * 43}
              filter="url(#glow)"
            >
              <animate 
                attributeName="stroke-dashoffset" 
                values={`${i * -100};${i * 100}`} 
                dur={`${25 + i * 3}s`} 
                repeatCount="indefinite" 
              />
            </line>
          ))}
        </svg>
      </div>
    </div>
  );
}