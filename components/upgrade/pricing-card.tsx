'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Check, Crown } from 'lucide-react';
import { toast } from 'sonner';

type BillingInterval = 'monthly' | 'annual';

export function PricingCard() {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('annual');

  // Fetch pricing details from API
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      return response.json();
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;
        if (trialDays > 0) {
          toast.success(`Starting your ${trialDays}-day free trial...`);
        }
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
    },
  });

  const handleUpgrade = () => {
    const priceId = selectedInterval === 'annual' && pricing?.annual
      ? pricing.annual.priceId
      : pricing?.monthly?.priceId;

    if (priceId) {
      upgradeMutation.mutate(priceId);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const monthlyPrice = pricing?.monthly ? formatPrice(pricing.monthly.amount, pricing.monthly.currency) : null;
  const annualPrice = pricing?.annual ? formatPrice(pricing.annual.amount, pricing.annual.currency) : null;
  const annualMonthlyEquivalent = pricing?.annual ? formatPrice(pricing.annual.amount / 12, pricing.annual.currency) : null;
  const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;

  // Calculate savings percentage
  const savingsPercentage = pricing?.monthly && pricing?.annual
    ? Math.round(((pricing.monthly.amount * 12 - pricing.annual.amount) / (pricing.monthly.amount * 12)) * 100)
    : 17; // Default to 17% (2 months free)

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto border-2 border-primary/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto border-2 border-primary/50 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="text-center pb-4 relative">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Premium Plan</CardTitle>
        <CardDescription className="text-base">Everything you need to manage your expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {/* Billing Toggle */}
        {pricing?.annual && (
          <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setSelectedInterval('monthly')}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedInterval === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('annual')}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all relative ${
                selectedInterval === 'annual'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <Badge variant="default" className="ml-2 text-xs">
                Save {savingsPercentage}%
              </Badge>
            </button>
          </div>
        )}

        {/* Pricing Display */}
        <div className="text-center py-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-foreground">
              {selectedInterval === 'annual' && annualMonthlyEquivalent
                ? annualMonthlyEquivalent
                : monthlyPrice}
            </span>
            <span className="text-muted-foreground">/ month</span>
          </div>
          {selectedInterval === 'annual' && annualPrice && (
            <p className="text-sm text-muted-foreground mt-2">
              {annualPrice} billed annually
            </p>
          )}
          {trialDays > 0 && (
            <Badge variant="default" className="mt-4">
              {trialDays}-day free trial
            </Badge>
          )}
        </div>

        {/* Benefits for annual plan */}
        {selectedInterval === 'annual' && pricing?.annual && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>2 months completely free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Lock in your price for a full year</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Best value for families & households</span>
              </li>
            </ul>
          </div>
        )}

        <Button
          onClick={handleUpgrade}
          disabled={upgradeMutation.isPending || !pricing}
          size="lg"
          className="w-full text-lg h-12"
        >
          {upgradeMutation.isPending ? (
            'Processing...'
          ) : (
            <>
              {trialDays > 0 ? 'Start Free Trial' : 'Upgrade Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {trialDays > 0
            ? `Try Premium free for ${trialDays} days. Cancel anytime.`
            : 'Cancel anytime. No long-term contracts.'}
        </p>
      </CardContent>
    </Card>
  );
}
