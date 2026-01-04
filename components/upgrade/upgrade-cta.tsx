'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const pricingDetails = {
  trial: process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0,
};

export function UpgradeCTA() {
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
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold">Ready to get started?</h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Join thousands of users who are taking control of their finances with ReceiptWise Premium
      </p>
      <Button
        onClick={handleUpgrade}
        disabled={upgradeMutation.isPending}
        size="lg"
        className="text-lg h-12 px-8"
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
    </div>
  );
}
