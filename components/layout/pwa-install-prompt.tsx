'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA already installed)
    const isStandalonePWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true || // iOS standalone
      document.referrer.includes('android-app://'); // Android TWA

    setIsStandalone(isStandalonePWA);

    // Check if iOS
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Check if mobile
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent.toLowerCase());

    // Don't show prompt if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = localStorage.getItem('pwa-install-dismissed-date');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Reset dismissal after 30 days for users who haven't installed
    if (dismissed && dismissedDate && parseInt(dismissedDate) < thirtyDaysAgo) {
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-date');
    }

    // Don't show if: already in standalone mode, dismissed recently, or not on mobile
    if (isStandalonePWA || (dismissed && dismissedDate && parseInt(dismissedDate) >= thirtyDaysAgo)) {
      return;
    }

    // Only show on mobile devices
    if (!isMobile) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt after a delay
    if (ios && !isStandalonePWA) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-date', Date.now().toString());
  };

  if (!showInstallPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <Card className="border-primary/20 bg-card/95 shadow-lg backdrop-blur-sm">
        <CardContent className="relative p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">Install ReceiptWise</h3>

              {isIOS ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Install this app on your iPhone:
                  </p>
                  <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>Tap the Share button in Safari</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right</li>
                  </ol>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Install the app for quick access and offline support.
                  </p>
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="w-full"
                  >
                    Install Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
