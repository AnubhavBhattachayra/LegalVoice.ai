'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../features/auth/firebase';
import Cookies from 'js-cookie';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionCreatedRef = useRef<boolean>(false);

  // Save user info to cookies (client-side only)
  const saveUserInfo = useCallback((user: User) => {
    try {
      // Save email in a cookie for session fallback
      if (user.email) {
        Cookies.set('user_email', user.email, { 
          expires: 14, // 14 days
          path: '/',
          sameSite: 'Lax'
        });
        
        console.log('User email saved to client cookie:', user.email);
      }
      
      // Save display name if available
      if (user.displayName) {
        Cookies.set('user_name', user.displayName, { 
          expires: 14,
          path: '/',
          sameSite: 'Lax'
        });
      }
      
      // Save UID for additional verification
      if (user.uid) {
        Cookies.set('user_uid', user.uid, {
          expires: 14,
          path: '/',
          sameSite: 'Lax'
        });
      }
    } catch (err) {
      console.error('Error saving user info to cookies:', err);
    }
  }, []);

  // Create a session cookie via the API
  const createSessionCookie = useCallback(async (user: User) => {
    try {
      // Get the ID token
      const idToken = await user.getIdToken(true);
      
      // Call our sessionLogin API
      const response = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Session creation failed:', errorData);
        return false;
      }
      
      const data = await response.json();
      console.log('Session created successfully, expires:', data.expiresAt);
      
      // Save user info to client cookies as well
      saveUserInfo(user);
      
      // Mark that we've created the session
      sessionCreatedRef.current = true;
      
      return true;
    } catch (err) {
      console.error('Error creating session:', err);
      return false;
    }
  }, [saveUserInfo]);

  // Check session status with the server
  const checkSessionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Session check failed:', response.status);
        return { isValid: false };
      }
      
      const data = await response.json();
      
      if (!data.isValid) {
        console.log(`Session invalid: ${data.reason} (${data.code})`);
        
        // If we have a specific error indicating the session needs to be recreated
        if (data.code === 'auth/session-expired-create-new' && user) {
          console.log('Session expired, creating a new one');
          await createSessionCookie(user);
        }
        
        return { isValid: false };
      } else {
        // Log time until expiry
        const expiresInDays = data.expiresIn ? Math.floor(data.expiresIn / 1000 / 60 / 60 / 24) : 'unknown';
        console.log(`Session valid, expires in ${expiresInDays} days`);
      }
      
      return { isValid: data.isValid };
    } catch (err) {
      console.error('Session check error:', err);
      return { isValid: false, error: err };
    }
  }, [user, createSessionCookie]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? `User ${currentUser.email} logged in` : 'User logged out');
      
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Create a session cookie if we haven't already
          if (!sessionCreatedRef.current) {
            await createSessionCookie(currentUser);
          }
        } catch (err) {
          console.error('Error during authentication:', err);
          // Try again after a delay
          setTimeout(async () => {
            try {
              await createSessionCookie(currentUser);
            } catch (retryErr) {
              console.error('Retry session creation failed:', retryErr);
            }
          }, 5000);
        }
      } else {
        // Clear user info cookies when logged out
        Cookies.remove('user_email');
        Cookies.remove('user_name');
        Cookies.remove('user_uid');
        
        // Reset session created flag
        sessionCreatedRef.current = false;
        
        setUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [createSessionCookie]);

  // Setup visibility change handling for session check
  useEffect(() => {
    if (!user) return;
    
    // Check session when the window becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking session');
        checkSessionStatus();
      }
    };
    
    // Handle page focus events
    const handleFocus = () => {
      console.log('Page focused, checking session');
      checkSessionStatus();
    };
    
    // Add handler for network reconnection
    const handleOnline = () => {
      console.log('Network connection restored, checking session');
      checkSessionStatus();
    };
    
    // Add various event listeners for better session coverage
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, checkSessionStatus]);

  // Register with email and password
  const register = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      
      // Create session cookie
      await createSessionCookie(userCredential.user);
      
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      
      // Create session cookie
      await createSessionCookie(userCredential.user);
      
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      
      // Create session cookie
      await createSessionCookie(userCredential.user);
      
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Manual refresh session - can be called by the app when needed
  const refreshSession = async () => {
    console.log('Manual session refresh requested by app');
    if (user) {
      return createSessionCookie(user);
    }
    return false;
  };

  // Logout
  const logout = async () => {
    setError(null);
    try {
      // Clear session cookie first
      await fetch('/api/auth/sessionLogout?revoke=false', {
        method: 'POST'
      });
      
      // Clear client-side cookies
      Cookies.remove('user_email');
      Cookies.remove('user_name');
      Cookies.remove('user_uid');
      
      // Reset session created flag
      sessionCreatedRef.current = false;
      
      // Then sign out from Firebase
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    login,
    signInWithGoogle,
    resetPassword,
    logout,
    refreshSession,
    checkSessionStatus
  };
}; 