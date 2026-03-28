'use client';

import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../features/auth/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useForm from '../lib/hooks/useForm';
import { isRequired, isValidEmail, isStrongPassword } from '../lib/utils/validation';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function Register() {
  const { register, signInWithGoogle } = useAuthContext();
  const [isRegistering, setIsRegistering] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const initialValues: RegisterFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  };

  const validationRules = {
    name: [
      {
        validator: isRequired,
        message: 'Full name is required',
      },
      {
        validator: (value: string) => value.length >= 2,
        message: 'Name must be at least 2 characters',
      },
    ],
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
        validator: (value: string) => value.length >= 8,
        message: 'Password must be at least 8 characters',
      },
      {
        validator: isStrongPassword,
        message: 'Password must include a mix of letters, numbers, and symbols',
      },
    ],
    confirmPassword: [
      {
        validator: isRequired,
        message: 'Please confirm your password',
      },
      {
        validator: (value: string, values: any) => value === values.password,
        message: 'Passwords do not match',
      },
    ],
    agreeToTerms: [
      {
        validator: (value: boolean) => value === true,
        message: 'You must agree to the terms and privacy policy',
      },
    ],
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setIsRegistering(true);
    
    try {
      // Register with Firebase
      const userCredential = await register(values.email, values.password);
      
      // Create user in MongoDB
      await axios.post('/api/users', {
        uid: userCredential.uid,
        email: values.email,
        displayName: values.name,
        createdAt: new Date().toISOString(),
      });
      
      // Update Firebase user profile with name
      await userCredential.updateProfile({
        displayName: values.name,
      });
      
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Please login or use a different email.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const userCredential = await signInWithGoogle();
      
      // Check if user already exists in MongoDB, if not create
      await axios.post('/api/users/google-auth', {
        uid: userCredential.uid,
        email: userCredential.email,
        displayName: userCredential.displayName,
        photoURL: userCredential.photoURL,
        createdAt: new Date().toISOString(),
      });
      
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
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
    onSubmit: handleRegister,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8 chat-gradient-bg">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-[color:var(--accent)] hover:text-[color:var(--accent)] hover:underline"
            >
              Sign in instead
            </Link>
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-[color:var(--card)] p-8 shadow-lg border border-[color:var(--border)]">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[color:var(--foreground)]"
              >
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaUser className="h-5 w-5 text-[color:var(--foreground)] opacity-60" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.name && errors.name?.length ? 'true' : 'false'}
                  aria-describedby={touched.name && errors.name?.length ? 'name-error' : undefined}
                  className={`block w-full rounded-md border pl-10 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] ${
                    touched.name && errors.name?.length
                      ? 'border-[color:var(--accent)]'
                      : 'border-[color:var(--border)]'
                  } focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]`}
                  placeholder="John Doe"
                />
              </div>
              {touched.name && errors.name?.length > 0 && (
                <p id="name-error" className="mt-2 text-sm text-[color:var(--accent)]" role="alert">{errors.name[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[color:var(--foreground)]"
              >
                Email Address
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
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-[color:var(--foreground)] opacity-70">
                Use at least 8 characters with a mix of letters, numbers, and symbols
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[color:var(--foreground)]"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaLock className="h-5 w-5 text-[color:var(--foreground)] opacity-60" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.confirmPassword && errors.confirmPassword?.length ? 'true' : 'false'}
                  aria-describedby={touched.confirmPassword && errors.confirmPassword?.length ? 'confirmPassword-error' : undefined}
                  className={`block w-full rounded-md border pl-10 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] ${
                    touched.confirmPassword && errors.confirmPassword?.length
                      ? 'border-[color:var(--accent)]'
                      : 'border-[color:var(--border)]'
                  } focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]`}
                  placeholder="••••••••"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword?.length > 0 && (
                <p id="confirmPassword-error" className="mt-2 text-sm text-[color:var(--accent)]" role="alert">{errors.confirmPassword[0]}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={values.agreeToTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-4 w-4 rounded border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-[color:var(--foreground)]"
              >
                I agree to the{' '}
                <Link href="/terms" className="text-[color:var(--accent)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[color:var(--accent)] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {touched.agreeToTerms && errors.agreeToTerms?.length > 0 && (
              <p className="mt-1 text-sm text-[color:var(--accent)]" role="alert">{errors.agreeToTerms[0]}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isRegistering || !isValid}
                aria-disabled={isRegistering || !isValid}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-[color:var(--primary)] py-2 px-4 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:bg-[color:var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed glow-effect"
              >
                {isRegistering ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  'Create Account'
                )}
              </button>
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
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isRegistering}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] py-2 px-4 text-sm font-medium text-[color:var(--foreground)] shadow-sm hover:bg-[color:var(--muted)] hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {googleLoading ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <>
                    <FaGoogle className="h-5 w-5 text-red-500" />
                    <span>Sign up with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 