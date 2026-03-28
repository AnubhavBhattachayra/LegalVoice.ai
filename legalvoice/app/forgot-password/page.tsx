'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { useAuthContext } from '../features/auth/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export default function ForgotPassword() {
  const { resetPassword } = useAuthContext();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePasswordReset = async (values: { email: string }) => {
    setIsSubmitting(true);
    setAuthError(null);
    
    try {
      await resetPassword(values.email);
      setIsSuccess(true);
      toast.success('Password reset email sent successfully.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setAuthError('No account exists with this email address.');
      } else {
        setAuthError(error.message || 'An error occurred while sending the password reset email');
      }
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8 chat-gradient-bg">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-80">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-[color:var(--card)] p-8 shadow-lg border border-[color:var(--border)]">
          {!isSuccess ? (
            <>
              {authError && (
                <div className="mb-6 rounded-md bg-[#331111] bg-opacity-50 border border-[#933] p-4 text-[#f88] text-sm">
                  {authError}
                </div>
              )}
              
              <Formik
                initialValues={{ email: '' }}
                validationSchema={ForgotPasswordSchema}
                onSubmit={handlePasswordReset}
              >
                {({ isValid, dirty }) => (
                  <Form className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[color:var(--foreground)]">
                        Email address
                      </label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <FaEnvelope className="h-5 w-5 text-[color:var(--foreground)] opacity-60" />
                        </div>
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="block w-full rounded-md border pl-10 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] border-[color:var(--border)] focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                      </div>
                      <ErrorMessage name="email" component="div" className="mt-1 text-sm text-[color:var(--accent)]" />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !(isValid && dirty)}
                        className={`group relative flex w-full justify-center rounded-md border border-transparent bg-[color:var(--primary)] py-2 px-4 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:bg-[color:var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed glow-effect`}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="small" color="white" />
                        ) : (
                          'Send reset link'
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[color:var(--primary)] bg-opacity-20 mb-4">
                <FaCheck className="h-6 w-6 text-[color:var(--accent)]" />
              </div>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)] mb-2">Check your email</h2>
              <p className="text-[color:var(--foreground)] opacity-90 mb-4">
                We've sent password reset instructions to your email address. Please check your inbox.
              </p>
              <p className="text-[color:var(--foreground)] opacity-70 text-sm mb-6">
                If you don't receive an email within a few minutes, check your spam folder or{' '}
                <button 
                  onClick={() => setIsSuccess(false)} 
                  className="text-[color:var(--accent)] hover:underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 text-sm font-medium text-[color:var(--foreground)] opacity-80 hover:opacity-100 hover:text-[color:var(--accent)]"
            >
              <FaArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 