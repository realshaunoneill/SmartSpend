'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

const POPUP_DISMISSED_KEY = 'exitIntentDismissed';
const POPUP_COOLDOWN_HOURS = 24;

export function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves through the top of the page
    if (e.clientY <= 0 && !hasTriggered) {
      // Check if popup was recently dismissed
      const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        if (hoursSinceDismissed < POPUP_COOLDOWN_HOURS) {
          return;
        }
      }

      setShowPopup(true);
      setHasTriggered(true);
    }
  }, [hasTriggered]);

  useEffect(() => {
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleDismiss = () => {
    setShowPopup(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  };

  const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS;
  const hasFreeTrial = trialDays && parseInt(trialDays) > 0;

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Wait! Don&apos;t Leave Empty-Handed</DialogTitle>
          <DialogDescription className="text-base">
            {hasFreeTrial ? (
              <>
                Start your <span className="font-semibold text-primary">{trialDays}-day free trial</span> today and see why thousands of families trust ReceiptWise to manage their expenses.
              </>
            ) : (
              <>
                Join <span className="font-semibold text-primary">10,000+ users</span> who are already saving time and money with ReceiptWise.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits list */}
          <div className="space-y-2">
            {[
              'AI-powered receipt scanning',
              'Share expenses with family & roommates',
              'Track spending trends automatically',
              'Never lose a receipt again',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/sign-up" onClick={handleDismiss}>
              <Button className="w-full gap-2" size="lg">
                {hasFreeTrial ? 'Start Free Trial' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleDismiss}
            >
              Maybe later
            </Button>
          </div>

          {hasFreeTrial && (
            <p className="text-center text-xs text-muted-foreground">
              No credit card required • Cancel anytime
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
