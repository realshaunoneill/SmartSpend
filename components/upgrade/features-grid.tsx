import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Upload,
  BarChart3,
  Users,
  Shield,
  Zap,
  Clock,
  Download,
  CreditCard,
  X,
} from 'lucide-react';

const features = [
  {
    icon: <Upload className="w-5 h-5" />,
    title: 'Receipt Uploads',
    description: 'Upload and scan receipts with AI extraction',
    free: 'View only',
    premium: 'Unlimited uploads',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Insights & Analytics',
    description: 'Deep insights into your spending patterns and trends',
    free: 'View only',
    premium: 'Full analytics',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Household Sharing',
    description: 'Share receipts and expenses with family or roommates',
    free: 'Not available',
    premium: 'Unlimited households',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Subscription Management',
    description: 'Track recurring subscriptions and upcoming payments',
    free: 'View only',
    premium: 'Full management',
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: 'Data Export',
    description: 'Export your data for taxes or backup anytime',
    free: 'Not available',
    premium: 'CSV & JSON export',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Priority Support',
    description: 'Get help when you need it with priority email support',
    free: 'Community support',
    premium: 'Priority support',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'AI Processing',
    description: 'Automatic receipt scanning and item extraction',
    free: 'Not available',
    premium: 'Included',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Data History',
    description: 'Access your complete financial history',
    free: 'View only',
    premium: 'Unlimited access',
  },
];

export function FeaturesGrid() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What's Included</h2>
        <p className="text-muted-foreground">Everything you need to manage your finances</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                {feature.icon}
              </div>
              <CardTitle className="text-base font-semibold text-foreground">{feature.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {feature.free === 'Not available' ? (
                    <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-muted-foreground">Free: {feature.free}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <Badge variant="secondary" className="font-medium text-xs">
                    {feature.premium}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
