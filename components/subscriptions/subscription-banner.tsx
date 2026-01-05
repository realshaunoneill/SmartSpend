'use client';

import { useState } from 'react';
import { X, Crown, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

interface SubscriptionBannerProps {
  page?: string;
}

const pageMessages = {
  dashboard: {
    title: 'Unlock Advanced Analytics',
    description: 'Get detailed spending insights, trends, and unlimited receipt storage',
  },
  receipts: {
    title: 'Store Unlimited Receipts',
    description: 'Never worry about storage limits with Premium receipt management',
  },
  sharing: {
    title: 'Enhanced Household Sharing',
    description: 'Create unlimited households and collaborate with more family members',
  },
  settings: {
    title: 'Premium Account Features',
    description: 'Unlock all premium features and priority support',
  },
  default: {
    title: 'Upgrade to Premium',
    description: 'Unlock unlimited receipts, advanced analytics, and household sharing',
  },
};

export function SubscriptionBanner({ page = 'default' }: SubscriptionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isSubscribed } = useUser();

  // Don't show banner if user is subscribed, dismissed, or not loaded
  if (isSubscribed || isDismissed || !user) {
    return null;
  }

  const message = pageMessages[page as keyof typeof pageMessages] || pageMessages.default;
  const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS
    ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS)
    : 0;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        if (trialDays > 0) {
          toast.success(`Starting your ${trialDays}-day free trial...`);
        }
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-4 mb-6 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{message.title}</h3>
              {trialDays > 0 && (
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {trialDays}-day free trial
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{message.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleSubscribe} disabled={isLoading} size="sm" className="gap-1.5">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Upgrade</span>
            <ArrowRight className="h-3.5 w-3.5 sm:hidden" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
