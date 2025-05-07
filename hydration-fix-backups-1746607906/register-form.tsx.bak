import { useState, useEffect } from 'react';'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AuthFormErrors, RegistrationData } from '@/types/auth';

export default function RegisterForm() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [generalError, setGeneralError] = useState('');
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for the changed field
    if (errors[name as keyof AuthFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: AuthFormErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setGeneralError('');
      
      // Submit registration request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Registration failed
        if (data.error?.fields) {
          setErrors(data.error.fields);
        } else {
          setGeneralError(data.error?.message || 'Registration failed. Please try again.');
        }
        return;
      }
      
      // Registration successful, sign in with the new credentials
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      
      if (signInResult?.error) {
        // Sign in failed after registration
        setGeneralError('Account created successfully, but could not sign in automatically. Please try signing in.');
        router.push('/login');
        return;
      }
      
      // Sign in successful, redirect to dashboard
      router.push('/dashboard');
      router.refresh();
      
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display general error message if any */}
      {generalError && (
        <div className="text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-md text-sm">
          {generalError}
        </div>
      )}
      
      {/* Name field */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-gray-800/50 border ${
            errors.name ? 'border-red-500' : 'border-gray-700'
          } rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none text-white`}
          placeholder="John Doe"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>
      
      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-gray-800/50 border ${
            errors.email ? 'border-red-500' : 'border-gray-700'
          } rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none text-white`}
          placeholder="you@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      
      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-gray-800/50 border ${
            errors.password ? 'border-red-500' : 'border-gray-700'
          } rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none text-white`}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </div>
      
      {/* Confirm Password field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-gray-800/50 border ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
          } rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none text-white`}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      
      {/* Terms and conditions */}
      <div className="flex items-center">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-cyan-500 focus:ring-cyan-500"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
          I agree to the{' '}
          <a href="#" className="text-cyan-400 hover:text-cyan-300">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-cyan-400 hover:text-cyan-300">
            Privacy Policy
          </a>
        </label>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-500 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </div>
          ) : (
            'Create account'
          )}
        </button>
      </div>
    </form>
  );
}