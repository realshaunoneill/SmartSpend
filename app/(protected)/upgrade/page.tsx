'use client';

import { Navigation } from '@/components/layout/navigation';
import { UpgradeHero } from '@/components/upgrade/upgrade-hero';
import { PricingCard } from '@/components/upgrade/pricing-card';
import { FeaturesGrid } from '@/components/upgrade/features-grid';
import { ComparisonTable } from '@/components/upgrade/comparison-table';
import { UpgradeCTA } from '@/components/upgrade/upgrade-cta';

export default function UpgradePage() {

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-20">
        <UpgradeHero />
        <PricingCard />
        <FeaturesGrid />
        <ComparisonTable />
        <UpgradeCTA />
      </div>
    </>
  );
}
