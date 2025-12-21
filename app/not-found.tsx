'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/layout/navigation';
import { FileQuestion, Home, ArrowLeft, Search, Receipt, TrendingUp, CreditCard, Settings, HelpCircle, Mail, ArrowRight, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6 min-h-[calc(100vh-12rem)] flex items-center">
        <div className="w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <FileQuestion className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">404</h1>
            <p className="mt-2 text-xl text-muted-foreground">Page Not Found</p>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Actions */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get back on track</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">Go Home</p>
                    <p className="text-sm text-muted-foreground">Return to the homepage</p>
                  </div>
                </Link>

                <button
                  onClick={() => router.back()}
                  className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group text-left"
                >
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <ArrowLeft className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-blue-500 transition-colors">Go Back</p>
                    <p className="text-sm text-muted-foreground">Return to previous page</p>
                  </div>
                </button>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                    <Search className="h-5 w-5 text-green-500 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-green-500 transition-colors">View Dashboard</p>
                    <p className="text-sm text-muted-foreground">Check your receipts and insights</p>
                  </div>
                </Link>
              </CardContent>
              <div className="absolute -z-10 right-0 bottom-0 top-1/2 left-1/2 bg-linear-to-br from-primary/5 via-primary/5 to-transparent blur-3xl" />
            </Card>

            {/* Help & Support */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Need Help?
                </CardTitle>
                <CardDescription>We're here to assist you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Common Pages</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/receipts"
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                    >
                      <Receipt className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Receipts</span>
                    </Link>
                    <Link
                      href="/insights"
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                    >
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Insights</span>
                    </Link>
                    <Link
                      href="/subscriptions"
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                    >
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Subscriptions</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                    >
                      <Settings className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Settings</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <Link href="/support" className="w-full">
                    <Button variant="outline" className="w-full justify-between group">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Visit Support Center
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <div className="absolute -z-10 left-0 bottom-0 top-1/2 right-1/2 bg-linear-to-bl from-blue-500/5 via-primary/5 to-transparent blur-3xl" />
            </Card>
          </div>

          <Card className="relative overflow-hidden border-2">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Still Need Help?</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    If you believe this is an error or need assistance, our support team is here to help.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link href="/support" className="flex-1 sm:flex-initial">
                    <Button variant="default" className="w-full group">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a
                    href="mailto:support@receiptwise.com"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button variant="outline" className="w-full group">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Email Us
                    </Button>
                  </a>
                </div>
              </div>
              <div className="absolute -z-10 inset-0 bg-linear-to-br from-primary/5 via-transparent to-blue-500/5 blur-2xl" />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
