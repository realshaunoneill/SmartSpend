import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

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
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Free vs Premium</CardTitle>
        <CardDescription>Compare plans and choose what's right for you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-2">Feature</th>
                <th className="text-center py-4 px-2">Free</th>
                <th className="text-center py-4 px-2 text-primary">Premium</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-4 px-2 font-medium">{feature.title}</td>
                  <td className="text-center py-4 px-2 text-muted-foreground text-sm">
                    {feature.free}
                  </td>
                  <td className="text-center py-4 px-2">
                    <div className="flex justify-center">
                      <Check className="w-5 h-5 text-primary" />
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
