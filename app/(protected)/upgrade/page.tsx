'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UpgradeHero } from '@/components/upgrade/upgrade-hero';
import { PricingCard } from '@/components/upgrade/pricing-card';
import { FeaturesGrid } from '@/components/upgrade/features-grid';
import { ComparisonTable } from '@/components/upgrade/comparison-table';
import { UpgradeCTA } from '@/components/upgrade/upgrade-cta';
import { useUser } from '@/lib/hooks/use-user';
import { Loader2 } from 'lucide-react';

export default function UpgradePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const isSubscribed = user?.subscribed ?? false;

  useEffect(() => {
    if (!isLoading && isSubscribed) {
      router.replace('/dashboard');
    }
  }, [isLoading, isSubscribed, router]);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }  // If subscribed, show nothing while redirecting
  if (isSubscribed) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-20">
        <UpgradeHero />
        <PricingCard />
        <FeaturesGrid />
        <ComparisonTable />
      <UpgradeCTA />
    </div>
  );
}