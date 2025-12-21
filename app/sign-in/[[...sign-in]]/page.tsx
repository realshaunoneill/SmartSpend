import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Scan, BarChart3, Users, CheckCircle2, Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ReceiptWise" className="h-8 w-auto" />
            <span className="text-xl font-bold text-foreground">ReceiptWise</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center relative">
            {/* Left Side - Benefits */}
            <div className="space-y-8 order-2 lg:order-1">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI-powered expense tracking
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Smart expense tracking made simple
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join thousands of users who are already managing their expenses smarter with AI-powered receipt scanning and insights.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Scan className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Receipt Scanning</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract merchant, amount, date, and line items from any receipt
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Spending Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize spending patterns with beautiful charts and category breakdowns
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Household Sharing</h3>
                    <p className="text-sm text-muted-foreground">
                      Share expenses with family members and track household spending together
                    </p>
                  </div>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Free to start, no credit card required</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Unlimited receipt storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Advanced analytics and insights</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Divider */}
            <Separator orientation="vertical" className="hidden lg:block h-auto absolute left-1/2 top-0 bottom-0 -translate-x-1/2" />

            {/* Right Side - Sign In Form */}
            <div className="order-1 lg:order-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 sm:p-10">
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Sign in to your account to continue tracking your expenses
                    </p>
                  </div>

                  <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Quick & Secure Sign In
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sign in with Google or create an account with your email. All data is encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <SignIn
                      appearance={{
                        elements: {
                          rootBox: 'w-full max-w-md',
                          card: 'shadow-none border-0 bg-transparent p-0',
                          headerTitle: 'hidden',
                          headerSubtitle: 'hidden',
                          formButtonPrimary: 'bg-primary hover:bg-primary/90',
                          formFieldInput: 'border-input',
                          footer: 'hidden',
                        },
                      }}
                      routing="path"
                      path="/sign-in"
                      signUpUrl="/sign-up"
                      forceRedirectUrl="/redirect"
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        New to ReceiptWise? Create your account in seconds.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>No credit card required</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>Free forever plan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
