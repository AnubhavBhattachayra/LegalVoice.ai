'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Form from '@/app/components/Form';
import Notification from '@/app/components/Notification';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Full Name',
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Email address',
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Password',
      required: true,
      validation: {
        minLength: 8
      },
      errorMessage: 'Password must be at least 8 characters'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm Password',
      required: true
    }
  ];

  const handleSubmit = async (data: any) => {
    setError(null);
    
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      throw err; // Rethrow so the Form component can handle the submission state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your account
            </Link>
          </p>
        </div>

        <Form 
          fields={formFields} 
          onSubmit={handleSubmit} 
          submitLabel="Create account" 
          isLoading={loading}
          className="mt-8 space-y-6"
        />
      </div>

      {error && <Notification type="error" message={error} />}
    </div>
  );
} 