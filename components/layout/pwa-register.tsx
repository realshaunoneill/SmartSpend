'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function PWARegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);

          // Check for updates on page load
          registration.update();

          // Check for updates periodically (every 30 minutes)
          setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000); // 30 minutes

          // Check for updates when page becomes visible
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update();
            }
          });

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  setWaitingWorker(newWorker);
                  
                  // Auto-update in background after 5 seconds
                  const autoUpdateTimer = setTimeout(() => {
                    console.log('Auto-updating service worker...');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }, 5000);

                  // Show toast with option to update immediately
                  toast.info('Update available', {
                    description: 'A new version will install automatically in 5 seconds',
                    duration: 5000,
                    action: {
                      label: 'Update Now',
                      onClick: () => {
                        clearTimeout(autoUpdateTimer);
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                      },
                    },
                  });
                }
              });
            }
          });

          // Check if there's already a waiting service worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            toast.info('Update available', {
              description: 'Click to update now',
              action: {
                label: 'Update',
                onClick: () => {
                  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                },
              },
            });
          }
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Reload page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('New service worker activated, reloading page...');
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
