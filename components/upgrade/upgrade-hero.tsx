import { Badge } from '@/components/ui/badge';
import { Crown, Gift } from 'lucide-react';

const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;

export function UpgradeHero() {
  return (
    <div className="text-center space-y-6">
      <Badge variant="secondary" className="gap-1.5">
        <Crown className="w-3.5 h-3.5" aria-hidden="true" />
        Premium Features
      </Badge>
      <h1 id="upgrade-title" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Upgrade to Premium
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Unlock the full power of ReceiptWise and take control of your finances
      </p>
      {trialDays > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Gift className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Start your <strong className="text-foreground">{trialDays}-day free trial</strong> today — no credit card required upfront</span>
        </div>
      )}
    </div>
  );
}
