'use client';

import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md border border-cyan-500/30 shadow-lg shadow-cyan-500/20 backdrop-blur-sm p-6 rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">
            Log In to CyberPulse
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter your credentials to access your dashboard
          </p>
        </div>
        
        <LoginForm callbackUrl={callbackUrl} />
        
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm"></div>
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-px opacity-10">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-cyan-500/20"></div>
          ))}
        </div>
      </div>
    </div>
  );
}