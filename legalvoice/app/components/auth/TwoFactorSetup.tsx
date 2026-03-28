'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/context/AuthContext';
import { FaKey, FaQrcode, FaCheck, FaTimes, FaExclamationTriangle, FaShieldAlt, FaCopy, FaSave, FaDownload } from 'react-icons/fa';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'verify' | 'backupCodes'>('setup');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initiateSetup();
    }
  }, [user]);

  const initiateSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to setup two-factor authentication');
      }
      
      setSetupData({
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
        otpauthUrl: data.otpauthUrl
      });
      
    } catch (err: any) {
      console.error('Error setting up 2FA:', err);
      setError(err.message || 'Failed to setup two-factor authentication');
      toast.error('Failed to setup two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      toast.error('Please enter a valid verification code');
      return;
    }
    
    setVerifying(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to verify code');
      }
      
      toast.success('Two-factor authentication enabled successfully');
      setBackupCodes(data.backupCodes);
      setStep('backupCodes');
      
    } catch (err: any) {
      console.error('Error verifying 2FA:', err);
      setError(err.message || 'Failed to verify code');
      toast.error('Failed to verify code');
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/[^0-9]/g, '');
    // Limit to 6 digits
    setVerificationCode(val.substring(0, 6));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast.error('Failed to copy to clipboard');
    });
  };

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return;
    
    const content = `LegalVoice.ai Two-Factor Authentication Backup Codes\n\nKeep these codes safe and secure. Each code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
    
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'legalvoice-2fa-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Backup codes downloaded');
  };

  const completeSetup = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Render different steps
  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <FaShieldAlt className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Set up Two-Factor Authentication</h2>
        <p className="mt-1 text-gray-600">
          Two-factor authentication adds an extra layer of security to your account
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="medium" />
        </div>
      ) : setupData ? (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              1. Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
            </p>
            <p className="text-sm text-gray-600">
              2. Scan this QR code with your authenticator app or enter the setup key manually
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="border border-gray-300 p-2 rounded-lg bg-white">
              <img 
                src={setupData.qrCodeUrl} 
                alt="QR Code for two-factor authentication"
                className="h-48 w-48"
              />
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-1">Manual entry key:</p>
              <div className="flex items-center space-x-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{setupData.secret}</code>
                <button 
                  onClick={() => copyToClipboard(setupData.secret)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Copy to clipboard"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep('verify')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Setup Failed</h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={initiateSetup}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <FaKey className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Setup</h2>
        <p className="mt-1 text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>
      
      <div>
        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
          Verification Code
        </label>
        <input
          type="text"
          id="verification-code"
          className="block w-full px-4 py-3 text-center text-2xl tracking-widest border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={verificationCode}
          onChange={handleInputChange}
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setStep('setup')}
          disabled={verifying}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={verifySetup}
          disabled={verifying || verificationCode.length !== 6}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
        >
          {verifying ? (
            <>
              <LoadingSpinner size="small" className="mr-2" /> Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );

  const renderBackupCodesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
          <FaCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Setup Successful</h2>
        <p className="mt-1 text-gray-600">
          Two-factor authentication has been enabled for your account
        </p>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Save your backup codes</h3>
            <p className="text-sm text-yellow-700 mt-1">
              If you lose access to your authenticator app, you can use these backup codes to sign in. Each code can only be used once.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
        <div className="grid grid-cols-2 gap-4">
          {backupCodes.map((code, index) => (
            <div key={index} className="font-mono text-sm bg-white p-2 border border-gray-300 rounded">
              {code}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => copyToClipboard(backupCodes.join('\n'))}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FaCopy className="mr-2" /> Copy
        </button>
        <button
          type="button"
          onClick={downloadBackupCodes}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FaDownload className="mr-2" /> Download
        </button>
      </div>
      
      <div className="pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={completeSetup}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {step === 'setup' && renderSetupStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'backupCodes' && renderBackupCodesStep()}
    </div>
  );
} 