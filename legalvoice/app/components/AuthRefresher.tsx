'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

/**
 * AuthRefresher Component
 * 
 * This component handles automatic session refreshing to ensure
 * that session cookies remain valid. Since session cookies last 
 * for 14 days, we don't need to refresh as often as with the 
 * 1-hour Firebase ID tokens.
 * 
 * It has no UI and should be included once at the app root level.
 */
export default function AuthRefresher() {
  const { user, refreshSession, checkSessionStatus } = useAuth();
  
  // Perform session check and refresh when needed
  useEffect(() => {
    if (!user) return;
    
    console.log('AuthRefresher: Setting up session refresh timers');
    
    // Check session status regularly
    const checkSessionInterval = setInterval(async () => {
      console.log('AuthRefresher: Checking session status');
      try {
        const { isValid } = await checkSessionStatus();
        
        if (!isValid) {
          console.log('AuthRefresher: Session needs refreshing');
          await refreshSession();
        }
      } catch (err) {
        console.error('AuthRefresher: Session check failed:', err);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
    
    // Force refresh once a day regardless of status checks
    const forceRefreshInterval = setInterval(() => {
      console.log('AuthRefresher: Executing guaranteed session refresh');
      refreshSession().catch(err => 
        console.error('AuthRefresher: Guaranteed refresh failed:', err)
      );
    }, 24 * 60 * 60 * 1000); // Once a day
    
    // Initial session check when component mounts
    checkSessionStatus().catch(err => 
      console.error('AuthRefresher: Initial session check failed:', err)
    );
    
    // Clean up all intervals
    return () => {
      console.log('AuthRefresher: Cleaning up refresh timers');
      clearInterval(checkSessionInterval);
      clearInterval(forceRefreshInterval);
    };
  }, [user, refreshSession, checkSessionStatus]);
  
  // This component doesn't render anything
  return null;
} 