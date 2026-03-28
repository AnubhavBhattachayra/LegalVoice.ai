'use client';

import React, { useEffect } from 'react';
import Navbar from "./Navbar";
import Footer from "./Footer";
import { AuthProvider as FeatureAuthProvider } from "../features/auth/AuthContext";
import { AuthProvider as LibAuthProvider } from "../lib/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { handleTokenExpiration } from '../lib/auth/authUtils';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize token expiration handler
  useEffect(() => {
    handleTokenExpiration();
  }, []);

  return (
    <LibAuthProvider>
      <FeatureAuthProvider>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster position="top-right" toastOptions={{
          style: {
            fontFamily: 'var(--font-space-grotesk)',
            background: '#1a1a2e', 
            color: '#e2e8f0',
            border: '1px solid #4b31da',
          },
        }} />
      </FeatureAuthProvider>
    </LibAuthProvider>
  );
} 