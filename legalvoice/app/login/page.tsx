'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaLock, FaEnvelope, FaGoogle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuthContext } from '../features/auth/AuthContext';
import useForm from '../lib/hooks/useForm';
import { isRequired, isValidEmail } from '../lib/utils/validation';
import { handleApiError } from '../lib/utils/errorHandler';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage = () => {
  const { login, signInWithGoogle } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Check if session expired from query params
    const expired = searchParams.get('session') === 'expired';
    if (expired) {
      setSessionExpired(true);
      toast.error('Your session has expired. Please log in again.');
    }

    // Fetch CSRF token
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data.csrfToken) {
            setCsrfToken(data.data.csrfToken);
          } else {
            console.error('Invalid response format:', data);
            toast.error('Failed to get security token. Please refresh the page.');
          }
        } else {
          console.error('Failed to fetch CSRF token:', response.statusText);
          toast.error('Failed to set up secure login. Please refresh the page.');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        toast.error('Failed to set up secure login. Please refresh the page.');
      }
    };

    fetchCsrfToken();
  }, [searchParams]);

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
    rememberMe: false,
  };

  const validationRules = {
    email: [
      {
        validator: isRequired,
        message: 'Email is required',
      },
      {
        validator: isValidEmail,
        message: 'Please enter a valid email address',
      },
    ],
    password: [
      {
        validator: isRequired,
        message: 'Password is required',
      },
      {
        validator: (value: string) => value.length >= 6,
        message: 'Password must be at least 6 characters long',
      }
    ],
  };

  const handleLoginSubmit = async (values: LoginFormValues) => {
    if (!csrfToken) {
      toast.error('Security token is missing. Please refresh the page and try again.');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // First verify CSRF token
      const csrfResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csrfToken }),
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        const error = await csrfResponse.json();
        throw new Error(error.error?.message || 'CSRF verification failed');
      }
      
      // Then proceed with login
      await login(values.email, values.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
  } = useForm({
    initialValues,
    validationRules,
    onSubmit: handleLoginSubmit,
  });

  const handleGoogleLogin = async () => {
    if (!csrfToken) {
      toast.error('Security token is missing. Please refresh the page and try again.');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // First verify CSRF token
      const csrfResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csrfToken }),
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        const error = await csrfResponse.json();
        throw new Error(error.error?.message || 'CSRF verification failed');
      }
      
      // Then proceed with Google login
      await signInWithGoogle();
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8 chat-gradient-bg">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-[color:var(--accent)] hover:text-[color:var(--accent)] hover:underline"
            >
              create a new account
            </Link>
          </p>
        </div>

        {sessionExpired && (
          <div className="rounded-md bg-[#332700] bg-opacity-50 border border-[#8B5E00] p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-[#FFAA00]" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[#FFCC66]">
                  Session expired
                </h3>
                <div className="mt-2 text-sm text-[#FFE0A3]">
                  <p>Your session has expired. Please sign in again to continue.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-lg bg-[color:var(--card)] p-8 shadow-lg border border-[color:var(--border)]">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[color:var(--foreground)]"
              >
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaEnvelope className="h-5 w-5 text-[color:var(--foreground)] opacity-60" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.email && errors.email?.length ? 'true' : 'false'}
                  aria-describedby={touched.email && errors.email?.length ? 'email-error' : undefined}
                  className={`block w-full rounded-md border pl-10 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] ${
                    touched.email && errors.email?.length
                      ? 'border-[color:var(--accent)]'
                      : 'border-[color:var(--border)]'
                  } focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]`}
                  placeholder="you@example.com"
                />
              </div>
              {touched.email && errors.email?.length > 0 && (
                <p id="email-error" className="mt-2 text-sm text-[color:var(--accent)]" role="alert">{errors.email[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[color:var(--foreground)]"
              >
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaLock className="h-5 w-5 text-[color:var(--foreground)] opacity-60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.password && errors.password?.length ? 'true' : 'false'}
                  aria-describedby={touched.password && errors.password?.length ? 'password-error' : undefined}
                  className={`block w-full rounded-md border pl-10 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] ${
                    touched.password && errors.password?.length
                      ? 'border-[color:var(--accent)]'
                      : 'border-[color:var(--border)]'
                  } focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]`}
                  placeholder="••••••••"
                />
              </div>
              {touched.password && errors.password?.length > 0 && (
                <p id="password-error" className="mt-2 text-sm text-[color:var(--accent)]" role="alert">{errors.password[0]}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-[color:var(--foreground)]"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[color:var(--secondary)] hover:text-[color:var(--secondary-hover)] hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn || !isValid || !csrfToken}
                aria-disabled={isLoggingIn || !isValid || !csrfToken}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-[color:var(--primary)] py-2 px-4 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:bg-[color:var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed glow-effect"
              >
                {isLoggingIn ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  'Sign in'
                )}
              </button>
              {!csrfToken && (
                <p className="mt-1 text-xs text-center text-[color:var(--accent)]">
                  Loading security token...
                </p>
              )}
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[color:var(--card)] px-2 text-[color:var(--foreground)] opacity-70">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] py-2 px-4 text-sm font-medium text-[color:var(--foreground)] shadow-sm hover:bg-[color:var(--muted)] hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaGoogle className="h-5 w-5 text-red-500" />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 