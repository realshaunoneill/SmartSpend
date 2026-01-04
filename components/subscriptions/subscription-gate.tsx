'use client';

import { Crown, Sparkles, ArrowRight, Upload, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/hooks/use-user';

interface SubscriptionGateProps {
  feature: 'upload' | 'sharing' | 'analytics'
  title?: string
  description?: string
  children?: React.ReactNode
  variant?: 'full' | 'inline'
}

const featureConfig = {
  upload: {
    icon: Upload,
    title: 'Receipt Upload',
    description: 'Upload and process new receipts with AI-powered data extraction',
    benefits: [
      'Unlimited receipt uploads',
      'AI-powered OCR extraction',
      'Smart categorization',
      'Cloud storage & sync',
    ],
  },
  sharing: {
    icon: Users,
    title: 'Household Sharing',
    description: 'Create households and share receipts with family members',
    benefits: [
      'Unlimited households',
      'Member management',
      'Real-time collaboration',
      'Shared expense tracking',
    ],
  },
  analytics: {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get detailed insights and spending analysis',
    benefits: [
      'Advanced charts & graphs',
      'Spending trends analysis',
      'Category breakdowns',
      'Export capabilities',
    ],
  },
};

export function SubscriptionGate({
  feature,
  title,
  description,
  children,
  variant = 'full',
}: SubscriptionGateProps) {
  const { user, isSubscribed, isLoading } = useUser();

  // If user is subscribed, render children normally
  if (isSubscribed) {
    return <>{children}</>;
  }

  // If user data is loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user data failed to load, render children (fail open for better UX)
  if (!user) {
    return <>{children}</>;
  }

  const config = featureConfig[feature];
  const FeatureIcon = config.icon;

  const handleSubscribe = async () => {
    try {
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

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  // Inline variant - compact upgrade button
  if (variant === 'inline') {
    return (
      <Button onClick={handleSubscribe} className="gap-2" variant="default">
        <Crown className="h-4 w-4" />
        Upgrade to Create
      </Button>
    );
  }

  // Full variant - complete card
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full border-2 border-primary/20 bg-primary/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/10">
            <FeatureIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-xs font-semibold">
              {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0 ? 'Try Premium Free' : 'Premium Feature'}
            </Badge>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {title || config.title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description || config.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-center text-sm font-semibold text-primary">
                🎉 Try free for {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS} days • No credit card required
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Premium to unlock this feature and many more
            </p>
            <Button onClick={handleSubscribe} size="lg" className="gap-2 shadow-lg">
              <Crown className="h-5 w-5" />
              Upgrade to Premium
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
