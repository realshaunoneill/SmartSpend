'use client';

import { useState } from 'react';
import { Crown, Loader2, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SubscriptionUpsellProps {
  title?: string;
  description?: string;
  features?: string[];
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
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
        const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS
          ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS)
          : 0;
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

  const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS
    ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS)
    : 0;

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button onClick={handleUpgrade} disabled={isLoading} size="sm" className="gap-1.5 shrink-0">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button onClick={handleUpgrade} disabled={isLoading} size="sm" className="gap-1.5 shrink-0">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-dashed ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          {trialDays > 0 && (
            <Badge variant="secondary" className="text-xs">
              {trialDays}-day free trial
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          <Button onClick={handleUpgrade} disabled={isLoading} className="w-full sm:w-auto gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {trialDays > 0 ? 'Start Free Trial' : 'Upgrade to Premium'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {trialDays > 0 && (
            <p className="text-xs text-muted-foreground">No credit card required • Cancel anytime</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
