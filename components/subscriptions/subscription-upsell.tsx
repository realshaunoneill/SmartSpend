'use client';

import { useState } from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionUpsellProps {
  title?: string
  description?: string
  features?: string[]
  className?: string
}

export function SubscriptionUpsell({
  title = 'Upgrade to Premium',
  description = 'Subscribe to unlock premium features:',
  features = [
    'Unlimited receipt uploads',
    'Advanced analytics and insights',
    'Household sharing',
    'AI-powered spending analysis',
  ],
  className = '',
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

  return (
    <Card className={`border-primary/50 bg-primary/5 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full sm:w-auto gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}
