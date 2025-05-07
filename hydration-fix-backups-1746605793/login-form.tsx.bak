'use client';

import type { ReactElement } from 'react';
import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  callbackUrl?: string;
  onModeChange?: (mode: 'login' | 'reset') => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface AsyncState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export default function LoginForm({ 
  callbackUrl = '/dashboard',
  onModeChange 
}: LoginFormProps): ReactElement {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [asyncState, setAsyncState] = useState<AsyncState>({
    isLoading: false,
    error: null,
    success: null,
  });
  
  // Real-time validation
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email';
    return null;
  };
  
  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };
  
  // Handle input changes with validation
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
    setAsyncState(prev => ({ ...prev, error: null }));
    
    // Real-time validation
    if (field === 'email' && typeof value === 'string') {
      const emailError = validateEmail(value);
      if (emailError) setErrors(prev => ({ ...prev, email: emailError }));
    }
    
    if (field === 'password' && typeof value === 'string') {
      const passwordError = validatePassword(value);
      if (passwordError) setErrors(prev => ({ ...prev, password: passwordError }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      // Focus first error field
      if (emailError) emailRef.current?.focus();
      else if (passwordError) passwordRef.current?.focus();
      return;
    }
    
    try {
      setAsyncState({ isLoading: true, error: null, success: null });
      
      // Attempt to sign in
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      
      if (result?.error) {
        // Authentication failed
        setAsyncState({
          isLoading: false,
          error: result.error === 'CredentialsSignin' 
            ? 'Invalid email or password' 
            : result.error,
          success: null,
        });
        passwordRef.current?.focus();
        return;
      }
      
      // Authentication successful
      setAsyncState({
        isLoading: false,
        error: null,
        success: 'Login Successful!',
      });
      
      // Small delay to show success message
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      setAsyncState({
        isLoading: false,
        error: 'An unexpected error occurred. Please try again.',
        success: null,
      });
    }
  };
  
  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(resetEmail);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    
    try {
      setAsyncState({ isLoading: true, error: null, success: null });
      
      // Make API call to reset password
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      setAsyncState({
        isLoading: false,
        error: null,
        success: 'Password reset instructions sent! Check your email.',
      });
      
      // Reset form and switch back after delay
      setResetEmail('');
      setTimeout(() => {
        handleModeChange(false);
        setAsyncState({ isLoading: false, error: null, success: null });
      }, 3000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setAsyncState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email',
        success: null,
      });
    }
  };
  
  // Handle mode change
  const handleModeChange = (reset: boolean) => {
    setIsResetMode(reset);
    setErrors({});
    setAsyncState({ isLoading: false, error: null, success: null });
    onModeChange?.(reset ? 'reset' : 'login');
  };
  
  // Focus management
  useEffect(() => {
    if (isResetMode) {
      emailRef.current?.focus();
    }
  }, [isResetMode]);
  
  // Success/Error message component
  const StatusMessage = ({ type, message }: { type: 'error' | 'success'; message: string }) => (
    <div
      className={`flex items-center gap-2 p-3 rounded-md text-sm font-medium ${
        type === 'error'
          ? 'text-red-400 bg-red-900/20 border border-red-800/50'
          : 'text-green-400 bg-green-900/20 border border-green-800/50'
      }`}
      role="alert"
      aria-live="polite"
    >
      {type === 'error' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
  
  if (isResetMode) {
    // Password reset form
    return (
      <form onSubmit={handlePasswordReset} className="space-y-6" noValidate>
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
        
        {/* Status messages */}
        {asyncState.error && <StatusMessage type="error" message={asyncState.error} />}
        {asyncState.success && <StatusMessage type="success" message={asyncState.success} />}
        
        {/* Email field */}
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              ref={emailRef}
              id="reset-email"
              name="reset-email"
              type="email"
              autoComplete="email"
              required
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                setErrors({});
                setAsyncState(prev => ({ ...prev, error: null }));
              }}
              className={`block w-full pl-11 pr-3 py-2.5 text-white bg-gray-900/50 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20'
              }`}
              placeholder="you@example.com"
              disabled={asyncState.isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>
        
        {/* Buttons */}
        <div className="space-y-4">
          <button
            type="submit"
            disabled={asyncState.isLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200"
          >
            {asyncState.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                Send Reset Link
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            className="w-full flex justify-center items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to login
          </button>
        </div>
      </form>
    );
  }
  
  // Login form
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Status messages */}
      {asyncState.error && <StatusMessage type="error" message={asyncState.error} />}
      {asyncState.success && <StatusMessage type="success" message={asyncState.success} />}
      
      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`block w-full pl-11 pr-3 py-2.5 text-white bg-gray-900/50 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20'
            }`}
            placeholder="you@example.com"
            disabled={asyncState.isLoading}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>
      
      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            className="text-sm text-cyan-400 hover:text-cyan-300 focus:outline-none focus:underline transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`block w-full pl-11 pr-11 py-2.5 text-white bg-gray-900/50 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
              errors.password
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20'
            }`}
            placeholder="••••••••"
            disabled={asyncState.isLoading}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-400">{errors.password}</p>
        )}
      </div>
      
      {/* Remember me checkbox */}
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
          className="h-4 w-4 text-cyan-500 bg-gray-900 border-gray-700 rounded focus:ring-cyan-500 focus:ring-offset-0"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
          Remember me for 30 days
        </label>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={asyncState.isLoading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200"
        >
          {asyncState.isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}