'use client';

import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const pricingDetails = {
  trial: process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0,
  price: '€9.99',
  period: 'month',
};

export function PricingCard() {
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        if (pricingDetails.trial > 0) {
          toast.success(`Starting your ${pricingDetails.trial}-day free trial...`);
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
    upgradeMutation.mutate();
  };

  return (
    <Card className="max-w-md mx-auto border-2 border-primary shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl">Premium Plan</CardTitle>
        <CardDescription>Everything you need to manage your expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold">{pricingDetails.price}</span>
            <span className="text-muted-foreground">/ {pricingDetails.period}</span>
          </div>
          {pricingDetails.trial > 0 && (
            <Badge variant="default" className="mt-4">
              {pricingDetails.trial}-day free trial
            </Badge>
          )}
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={upgradeMutation.isPending}
          size="lg"
          className="w-full text-lg h-12"
        >
          {upgradeMutation.isPending ? (
            'Processing...'
          ) : (
            <>
              {pricingDetails.trial > 0 ? 'Start Free Trial' : 'Upgrade Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {pricingDetails.trial > 0
            ? `Try Premium free for ${pricingDetails.trial} days. Cancel anytime.`
            : 'Cancel anytime. No long-term contracts.'}
        </p>
      </CardContent>
    </Card>
  );
}
