'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaLock, 
  FaShieldAlt, 
  FaMobile, 
  FaKey, 
  FaSpinner, 
  FaArrowLeft,
  FaCheck,
  FaExclamationTriangle,
  FaSyncAlt,
  FaFingerprint,
  FaTrash,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Security settings interface
interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'none' | 'sms' | 'app';
  phoneNumber: string;
  loginHistory: LoginEvent[];
  passwordLastChanged: number;
  passwordStrength: 'weak' | 'medium' | 'strong';
  sessionTimeout: number; // minutes
  sessions: SessionInfo[];
}

// Login event interface
interface LoginEvent {
  id: string;
  date: number;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  successful: boolean;
}

// Session info interface
interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: number;
  current: boolean;
}

const SecurityPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChanging2FA, setIsChanging2FA] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Mock security settings
  const mockSecuritySettings: SecuritySettings = {
    twoFactorEnabled: false,
    twoFactorMethod: 'none',
    phoneNumber: '+1 (555) 123-4567',
    passwordLastChanged: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    passwordStrength: 'medium',
    sessionTimeout: 30,
    loginHistory: [
      {
        id: 'login_1',
        date: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        ipAddress: '192.168.1.1',
        location: 'San Francisco, CA, USA',
        device: 'Windows PC',
        browser: 'Chrome 98.0.4758.102',
        successful: true
      },
      {
        id: 'login_2',
        date: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        ipAddress: '192.168.1.1',
        location: 'San Francisco, CA, USA',
        device: 'iPhone',
        browser: 'Safari 15.1',
        successful: true
      },
      {
        id: 'login_3',
        date: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        ipAddress: '211.42.51.123',
        location: 'Unknown location',
        device: 'Unknown device',
        browser: 'Unknown browser',
        successful: false
      },
      {
        id: 'login_4',
        date: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        ipAddress: '192.168.1.1',
        location: 'San Francisco, CA, USA',
        device: 'Windows PC',
        browser: 'Chrome 98.0.4758.102',
        successful: true
      }
    ],
    sessions: [
      {
        id: 'session_1',
        device: 'Windows PC',
        browser: 'Chrome 98.0.4758.102',
        location: 'San Francisco, CA, USA',
        lastActive: Date.now(),
        current: true
      },
      {
        id: 'session_2',
        device: 'iPhone',
        browser: 'Safari 15.1',
        location: 'San Francisco, CA, USA',
        lastActive: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        current: false
      }
    ]
  };
  
  // Load user data
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/user/security');
      return;
    }
    
    if (user) {
      // In a real app, this would be an API call
      setTimeout(() => {
        setSecuritySettings(mockSecuritySettings);
        setIsLoading(false);
      }, 1000);
    }
  }, [user, authLoading, router]);
  
  // Handle change password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setPasswordError('');
    
    // Validation
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setShowChangePasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update password last changed date
      if (securitySettings) {
        setSecuritySettings({
          ...securitySettings,
          passwordLastChanged: Date.now(),
          passwordStrength: 'strong'
        });
      }
    }, 1500);
  };
  
  // Handle enable/disable 2FA
  const handleToggle2FA = () => {
    if (!securitySettings) return;
    
    setIsChanging2FA(true);
    
    // Simulate API call
    setTimeout(() => {
      setSecuritySettings({
        ...securitySettings,
        twoFactorEnabled: !securitySettings.twoFactorEnabled,
        twoFactorMethod: !securitySettings.twoFactorEnabled ? 'sms' : 'none'
      });
      setIsChanging2FA(false);
    }, 1500);
  };
  
  // Handle session timeout change
  const handleSessionTimeoutChange = (minutes: number) => {
    if (!securitySettings) return;
    
    setSecuritySettings({
      ...securitySettings,
      sessionTimeout: minutes
    });
  };
  
  // Handle session termination
  const handleTerminateSession = (sessionId: string) => {
    if (!securitySettings) return;
    
    // Cannot terminate current session
    const session = securitySettings.sessions.find(s => s.id === sessionId);
    if (session?.current) return;
    
    setSecuritySettings({
      ...securitySettings,
      sessions: securitySettings.sessions.filter(s => s.id !== sessionId)
    });
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate days since password change
  const getDaysSincePasswordChange = () => {
    if (!securitySettings) return 0;
    
    const diff = Date.now() - securitySettings.passwordLastChanged;
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  };
  
  // Get password strength indicator
  const getPasswordStrengthIndicator = () => {
    if (!securitySettings) return null;
    
    switch (securitySettings.passwordStrength) {
      case 'weak':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Weak
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium
          </span>
        );
      case 'strong':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Strong
          </span>
        );
    }
  };
  
  // Get time since last active
  const getTimeSinceLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Otherwise use date
    return formatDate(timestamp);
  };
  
  // Loading state
  if (authLoading || (isLoading && user)) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }
  
  // No user, redirect handled in useEffect
  if (!user && !authLoading) {
    return null;
  }
  
  return (
    <main className="min-h-screen pt-32 pb-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/user/dashboard" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Settings</h1>
        
        {/* Security summary */}
        {securitySettings && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaLock className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Password</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Last changed {getDaysSincePasswordChange()} days ago
                </p>
                <div className="flex items-center">
                  <span className="text-sm mr-2">Strength:</span>
                  {getPasswordStrengthIndicator()}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaShieldAlt className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Status: {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
                {securitySettings.twoFactorEnabled && (
                  <p className="text-sm text-gray-600">
                    Method: {securitySettings.twoFactorMethod === 'sms' ? 'SMS' : 'Authenticator App'}
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaKey className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Active Sessions</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {securitySettings.sessions.length} active {securitySettings.sessions.length === 1 ? 'session' : 'sessions'}
                </p>
                <p className="text-sm text-gray-600">
                  Auto-logout after {securitySettings.sessionTimeout} minutes of inactivity
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Password settings */}
        {securitySettings && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Password</h2>
            
            {showChangePasswordForm ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {passwordError && (
                  <div className="text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Changing...
                      </>
                    ) : 'Change Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-gray-600 mb-6">
                  We recommend changing your password regularly and using a strong, unique password that you don't use for other services.
                </p>
                
                <button
                  onClick={() => setShowChangePasswordForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Two-factor authentication */}
        {securitySettings && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Two-Factor Authentication</h2>
            
            <p className="text-gray-600 mb-6">
              Two-factor authentication adds an extra layer of security to your account. In addition to your password, you'll need a code from your phone to log in.
            </p>
            
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
              <div>
                <p className="font-medium text-gray-900 mb-1">Status: {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                {securitySettings.twoFactorEnabled && (
                  <p className="text-sm text-gray-600">
                    Method: {securitySettings.twoFactorMethod === 'sms' ? `SMS (${securitySettings.phoneNumber})` : 'Authenticator App'}
                  </p>
                )}
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={isChanging2FA}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  securitySettings.twoFactorEnabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
              >
                {isChanging2FA ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {securitySettings.twoFactorEnabled ? 'Disabling...' : 'Enabling...'}
                  </>
                ) : (
                  securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'
                )}
              </button>
            </div>
            
            {!securitySettings.twoFactorEnabled && (
              <div className="text-sm text-yellow-800 bg-yellow-50 p-4 rounded-lg">
                <div className="flex">
                  <FaExclamationTriangle className="flex-shrink-0 h-5 w-5 text-yellow-400 mr-2" />
                  <p>
                    We strongly recommend enabling two-factor authentication to protect your account.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Session management */}
        {securitySettings && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Session Management</h2>
            
            <div className="mb-6">
              <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 mb-1">
                Auto-logout after inactivity
              </label>
              <select
                id="session-timeout"
                value={securitySettings.sessionTimeout}
                onChange={(e) => handleSessionTimeoutChange(parseInt(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
            <div className="space-y-4">
              {securitySettings.sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      {session.device} / {session.browser}
                      {session.current && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.location} • Last active: {getTimeSinceLastActive(session.lastActive)}
                    </p>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Login history */}
        {securitySettings && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Login History</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {showHistory ? 'Hide history' : 'Show history'}
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-4 mt-4">
                {securitySettings.loginHistory.map(login => (
                  <div 
                    key={login.id} 
                    className={`p-4 rounded-lg ${login.successful ? 'bg-gray-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">
                        {login.device} / {login.browser}
                      </div>
                      <div className={`text-sm ${login.successful ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {login.successful ? 'Successful' : 'Failed'}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {formatDate(login.date)}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {login.ipAddress} • {login.location}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default SecurityPage; 