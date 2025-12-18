import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export function UpgradeHero() {
  return (
    <div className="text-center space-y-6">
      <Badge variant="secondary" className="mb-2">
        <Sparkles className="w-3 h-3 mr-1" />
        Premium Features
      </Badge>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        Upgrade to Premium
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Unlock the full power of SmartSpend and take control of your finances
      </p>
    </div>
  );
}
