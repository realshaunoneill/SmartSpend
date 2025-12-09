'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Receipt, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/layout/navigation';

interface SuccessContentProps {
  sessionId?: string;
  subscriptionStatus?: string;
  userName?: string;
}

export default function SuccessContent({
  sessionId,
  subscriptionStatus,
  userName,
}: SuccessContentProps) {
  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {/* Success Animation */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/30 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to Premium, {userName}! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Your subscription is now active
            </p>
          </div>

          {/* Features Card */}
          <Card className="w-full max-w-2xl border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-400">
                You now have access to:
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                All premium features are unlocked and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <Receipt className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Unlimited Receipts</p>
                    <p className="text-xs text-muted-foreground">Upload and process as many receipts as you need</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Advanced Insights</p>
                    <p className="text-xs text-muted-foreground">AI-powered spending analysis and trends</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Household Sharing</p>
                    <p className="text-xs text-muted-foreground">Share receipts with family members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Premium Support</p>
                    <p className="text-xs text-muted-foreground">Priority customer support</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button asChild className="flex-1 gap-2" size="lg">
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/receipts">
                Upload Receipt
              </Link>
            </Button>
          </div>

          {/* Session Details */}
          {sessionId && (
            <p className="text-xs text-muted-foreground text-center">
              Session ID: {sessionId}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
