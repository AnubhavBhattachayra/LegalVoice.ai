'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaKey, FaLock, FaArrowLeft } from 'react-icons/fa';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface TwoFactorAuthFormProps {
  userId: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function TwoFactorAuthForm({ userId, onBack, onSuccess }: TwoFactorAuthFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle different input types based on whether we're using backup code or not
    if (isUsingBackupCode) {
      // Allow alphanumeric characters for backup code
      setCode(e.target.value.toUpperCase());
    } else {
      // Only numbers for TOTP and limit to 6 digits
      const val = e.target.value.replace(/[^0-9]/g, '');
      setCode(val.substring(0, 6));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUsingBackupCode && code.length < 8) {
      setError('Please enter a valid backup code');
      return;
    }
    
    if (!isUsingBackupCode && code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/two-factor/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token: isUsingBackupCode ? null : code,
          backupCode: isUsingBackupCode ? code : null,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Authentication failed');
      }
      
      // Authentication successful
      toast.success('Authentication successful');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
      
    } catch (err: any) {
      console.error('2FA authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
      toast.error('Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInputMode = () => {
    setIsUsingBackupCode(!isUsingBackupCode);
    setCode('');
    setError(null);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <FaLock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {isUsingBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isUsingBackupCode 
            ? 'Enter one of your backup codes to sign in' 
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="verification-code" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {isUsingBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            type="text"
            id="verification-code"
            className="block w-full px-4 py-3 text-lg text-center tracking-wider border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder={isUsingBackupCode ? "XXXXXXXX" : "000000"}
            value={code}
            onChange={handleInputChange}
            maxLength={isUsingBackupCode ? 8 : 6}
            autoComplete={isUsingBackupCode ? "off" : "one-time-code"}
            inputMode={isUsingBackupCode ? "text" : "numeric"}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
        </div>
        
        <div className="flex flex-col items-center space-y-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={toggleInputMode}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isUsingBackupCode 
              ? 'Use authenticator app instead' 
              : 'Use a backup code instead'}
          </button>
          
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              <FaArrowLeft className="mr-1" /> Back to login
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 