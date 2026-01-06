'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw, CreditCard, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function PaymentFailedPage() {
  const router = useRouter();

  const commonErrorReasons = [
    {
      title: 'Insufficient funds',
      content:
        "Your card doesn't have enough funds to complete this purchase. Please try a different payment method or contact your bank.",
    },
    {
      title: 'Card declined',
      content:
        'Your card was declined by the issuing bank. This could be due to temporary holds, daily spending limits, or fraud protection measures.',
    },
    {
      title: 'Incorrect card information',
      content:
        "The card details you entered (number, expiration date, CVV, or billing address) don't match what your bank has on file.",
    },
    {
      title: 'Expired card',
      content: 'Your card has expired. Please update your payment information with a valid card.',
    },
    {
      title: 'Technical issue',
      content:
        'We encountered a technical issue while processing your payment. This is usually temporary and resolves quickly.',
    },
  ];

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {/* Error Icon */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Payment Failed
            </h1>
            <p className="text-lg text-muted-foreground">
              We were unable to process your payment
            </p>
          </div>

          {/* Error Card */}
          <Card className="w-full max-w-2xl border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-400">
                What happened?
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Your payment could not be completed. This can happen for several reasons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Common reasons for payment failure:</p>
                <Accordion type="single" collapsible className="w-full">
                  {commonErrorReasons.map((reason, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-sm">{reason.title}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {reason.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              onClick={() => router.push('/settings')}
              className="flex-1 gap-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Help Section */}
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Update Payment Method</p>
                    <p className="text-xs text-muted-foreground">Try using a different card or payment method</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Contact Support</p>
                    <p className="text-xs text-muted-foreground">We're here to help resolve any issues</p>
                  </div>
                </div>
              </div>
              <div className="text-center pt-2">
                <Button asChild variant="link" size="sm">
                  <Link href="mailto:support@receiptwise.io">
                    Email us at support@receiptwise.io
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
  );
}
