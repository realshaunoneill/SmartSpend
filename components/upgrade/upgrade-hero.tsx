import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function UpgradeHero() {
  return (
    <div className="text-center space-y-6">
      <Badge variant="secondary" className="gap-1.5">
        <Crown className="w-3.5 h-3.5" />
        Premium Features
      </Badge>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Upgrade to Premium
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Unlock the full power of ReceiptWise and take control of your finances
      </p>
    </div>
  );
}
