import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div>
      <h2 className="text-2xl font-bold text-center mb-8">What's Included</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Free:</span>
                  <span>{feature.free}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium text-primary">{feature.premium}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
