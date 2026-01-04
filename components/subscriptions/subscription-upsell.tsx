'use client';

import { useState } from 'react';
import { Crown, Loader2, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionUpsellProps {
  title?: string
  description?: string
  features?: string[]
  className?: string
  variant?: 'default' | 'compact'
}

export function SubscriptionUpsell({
  title = 'Unlock Premium Features',
  description = 'Get the most out of ReceiptWise with our Premium plan',
  features = [
    'Unlimited receipt uploads',
    'Advanced analytics and insights',
    'Household sharing',
    'AI-powered spending analysis',
    'Priority support',
  ],
  className = '',
  variant = 'default',
}: SubscriptionUpsellProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
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
        const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;
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

  if (variant === 'compact') {
    return (
      <Card className={`border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            size="sm"
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden border-primary/30 ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <CardContent className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left side - Content */}
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-2.5">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{title}</h3>
              </div>
              <p className="text-muted-foreground max-w-md">
                {description}
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <div className="rounded-full bg-primary/20 p-1">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - CTA */}
          <div className="flex flex-col items-center gap-3 lg:items-end">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              size="lg"
              className="gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Start Free Trial
            </Button>
            <p className="text-xs text-muted-foreground">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
