'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import axios from 'axios';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set auth token for API requests
  const setAuthToken = async (user: User | null) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        console.log('Setting auth token for API requests');
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    } else {
      console.log('Clearing auth token');
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await setAuthToken(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Register with email and password
  const register = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      await setAuthToken(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      await setAuthToken(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      await setAuthToken(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      await setAuthToken(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const authValues = {
    user,
    loading,
    error,
    register,
    login,
    signInWithGoogle,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 