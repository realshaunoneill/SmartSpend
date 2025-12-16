'use client';

import { useEffect } from 'react';

export function PWAGoogleOneTap() {
  useEffect(() => {
    // Check if running as PWA
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (!isPWA) {
      return;
    }

    // Check if user is already signed in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.authenticated) {
          return; // User is already signed in
        }

        // User is not signed in and using PWA - enable Google One Tap
        // Clerk will automatically show Google One Tap if configured
        console.log('PWA mode detected - Google One Tap enabled');
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuth();
  }, []);

  return null;
}
