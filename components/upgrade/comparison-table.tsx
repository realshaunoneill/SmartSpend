import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Minus } from 'lucide-react';

const features = [
  {
    title: 'Receipt Uploads',
    free: 'View only',
  },
  {
    title: 'Insights & Analytics',
    free: 'View only',
  },
  {
    title: 'Household Sharing',
    free: 'Not available',
  },
  {
    title: 'Subscription Management',
    free: 'View only',
  },
  {
    title: 'Data Export',
    free: 'Not available',
  },
  {
    title: 'Priority Support',
    free: 'Community support',
  },
  {
    title: 'AI Processing',
    free: 'Not available',
  },
  {
    title: 'Data History',
    free: 'View only',
  },
];

export function ComparisonTable() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Free vs Premium</CardTitle>
        <CardDescription className="text-base">Compare plans and choose what's right for you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-3 sm:px-4 text-sm font-semibold text-foreground">Feature</th>
                <th className="text-center py-4 px-3 sm:px-4 text-sm font-semibold text-muted-foreground">Free</th>
                <th className="text-center py-4 px-3 sm:px-4">
                  <Badge variant="default" className="font-semibold">Premium</Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-3 sm:px-4 font-medium text-foreground">{feature.title}</td>
                  <td className="text-center py-4 px-3 sm:px-4">
                    {feature.free === 'Not available' ? (
                      <div className="flex justify-center">
                        <Minus className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{feature.free}</span>
                    )}
                  </td>
                  <td className="text-center py-4 px-3 sm:px-4">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
