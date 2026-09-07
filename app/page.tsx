'use client';

import Link from 'next/link';
import { Receipt, Scan, Users, BarChart3, Shield, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Lock, Search, Cloud, Chrome, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Navigation } from '@/components/layout/navigation';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ExitIntentPopup } from '@/components/landing/exit-intent-popup';
import { useUser } from '@clerk/nextjs';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const features = [
  {
    icon: Users,
    title: 'Household Sharing',
    description: 'Create households for family, roommates, or partners. Everyone can upload receipts and track shared expenses together.',
    gradient: 'from-orange-500/10 to-amber-500/10',
  },
  {
    icon: Scan,
    title: 'AI Receipt Scanning',
    description: 'Upload receipts and our AI extracts merchant, amount, date, and line items automatically.',
    gradient: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    icon: BarChart3,
    title: 'Spending Analytics',
    description: 'See who spent what with household breakdowns, category analysis, and spending trends.',
    gradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'All household members see receipts in real-time with automatic cloud synchronization.',
    gradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    icon: Search,
    title: 'Powerful Search',
    description: 'Search all household receipts by merchant, category, or specific items. Find any receipt instantly.',
    gradient: 'from-violet-500/10 to-purple-500/10',
  },
  {
    icon: Receipt,
    title: 'Receipt Storage',
    description: 'Never lose a receipt again. All household receipts stored securely and searchable.',
    gradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    icon: Chrome,
    title: 'Chrome Extension',
    description: 'Capture receipts from any webpage with our browser extension. One-click snipping tool for email receipts and online purchases.',
    gradient: 'from-indigo-500/10 to-blue-500/10',
  },
];

// NOTE: no usage/user-count stats here on purpose. Anything claimed on this page has to
// be independently true. Add real numbers only once they are real and measured.

const benefits = [
  { text: 'Perfect for families & roommates', comingSoon: false },
  { text: 'Real-time collaboration', comingSoon: false },
  { text: 'Everyone can upload receipts', comingSoon: false },
  { text: 'Automatic categorization', comingSoon: false },
  { text: 'Export reports for taxes', comingSoon: false },
  { text: 'Track shared subscriptions', comingSoon: false },
  { text: 'Chrome extension for easy capture', comingSoon: false },
];

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser();

  // Header component that handles loading state gracefully
  const Header = () => {
    // If loaded and signed in, show full navigation
    if (isLoaded && isSignedIn) {
      return <Navigation />;
    }

    // Show landing header (works for both loading and not-signed-in states)
    // This prevents the flash because we show the same header during loading
    return (
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="ReceiptWise Home">
            <img src="/logo.png" alt="" className="h-8 w-auto" aria-hidden="true" />
            <span className="text-xl font-bold text-foreground">ReceiptWise</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!isLoaded ? (
              // Show skeleton button while loading to prevent flash
              <Skeleton className="h-10 w-[72px] rounded-md" />
            ) : (
              <Link href="/sign-in">
                <Button className="shadow-lg shadow-primary/20">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">
        Skip to main content
      </a>
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main id="main-content">
      <section className="relative overflow-hidden px-4 py-20 sm:py-28" aria-labelledby="hero-title">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent dark:from-primary/10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm" role="status" aria-live="polite">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Now with AI-powered receipt scanning
          </div>
          <h1 id="hero-title" className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Track Every Penny,{' '}
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            The expense tracker built for sharing. Perfect for families, roommates, and couples who want to manage receipts and track spending together.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!isLoaded ? (
              // Show skeleton buttons while loading
              <>
                <Skeleton className="h-12 w-44 rounded-md" />
                <Skeleton className="h-12 w-40 rounded-md" />
              </>
            ) : isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                    {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0 ? 'Start Free Trial' : 'Start Tracking Free'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-border/50 backdrop-blur-sm"
                  onClick={() => scrollToSection('features')}
                >
                  <TrendingUp className="h-4 w-4" />
                  See How It Works
                </Button>
              </>
            )}
          </div>
          {isLoaded && !isSignedIn && process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Start your {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS}-day free trial • Cancel anytime
            </p>
          )}
        </div>

        {/* Dashboard Preview */}
        <div className="mx-auto mt-20 w-full max-w-6xl">
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-accent/5" />
            {/* Light mode screenshot */}
            <img
              src="/dashboard-full-light.png"
              alt="ReceiptWise Dashboard"
              className="w-full dark:hidden"
            />
            {/* Dark mode screenshot */}
            <img
              src="/dashboard-full-dark.png"
              alt="ReceiptWise Dashboard"
              className="hidden w-full dark:block"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/50 px-4 py-20 scroll-mt-20" aria-labelledby="features-title">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Features
            </div>
            <h2 id="features-title" className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Everything You Need to Manage Expenses
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <CardContent className="relative p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-all group-hover:scale-110 group-hover:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-border/50 bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Benefits
              </div>
              <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                Built for Sharing
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Built for families, roommates and couples who track expenses together.
                No more lost receipts, no more confusion about who paid what.
              </p>
              <ul className="mb-8 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit.text} className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${benefit.comingSoon ? 'bg-muted' : 'bg-primary/10'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${benefit.comingSoon ? 'text-muted-foreground/60' : 'text-primary'}`} />
                    </div>
                    <span className={`text-sm font-medium ${benefit.comingSoon ? 'text-muted-foreground' : 'text-foreground'}`}>{benefit.text}</span>
                    {benefit.comingSoon && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">Soon</span>
                    )}
                  </li>
                ))}
              </ul>
              {!isLoaded ? (
                <Skeleton className="h-12 w-[180px] rounded-md" />
              ) : isSignedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0 ? 'Start Free Trial' : 'Get Started for Free'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-linear-to-r from-primary/20 to-accent/20 opacity-20 blur-2xl" />
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm">
                  {/* Light mode screenshot */}
                  <img
                    src="/sharing-light.png"
                    alt="ReceiptWise Household Sharing"
                    className="w-full dark:hidden"
                  />
                  {/* Dark mode screenshot */}
                  <img
                    src="/sharing-dark.png"
                    alt="ReceiptWise Household Sharing"
                    className="hidden w-full dark:block"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border/50 bg-muted/30 px-4 py-20 scroll-mt-20" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
              <Crown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Simple Pricing
            </div>
            <h2 id="pricing-title" className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              One plan, everything included
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Try every feature free for {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS || '7'} days. Cancel any time during the trial and you won&apos;t be charged.
            </p>
          </div>

          {/* A free tier is not implemented yet — see P1-1 in the readiness plan. The
              €0 card that used to sit here advertised 5 receipts/month, which the API
              rejected with a 403. It comes back when the €0 Stripe price is live. */}
          <div className="mx-auto max-w-md">
            {/* Pro Plan */}
            <Card className="relative overflow-hidden border-primary/50 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/10">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                  <p className="text-sm text-muted-foreground">For power users & families</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">€4.99</span>
                  <span className="text-muted-foreground">/month</span>
                  <p className="mt-1 text-sm text-primary">or €39.99/year (save 33%)</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Unlimited receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">AI receipt scanning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Advanced analytics & insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Unlimited households</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Subscription tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Chrome extension</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Export to CSV/JSON</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
                {!isLoaded ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : isSignedIn ? (
                  <Link href="/upgrade" className="block">
                    <Button className="w-full gap-2 shadow-lg shadow-primary/20">
                      Upgrade to Pro
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/sign-up" className="block">
                    <Button className="w-full gap-2 shadow-lg shadow-primary/20">
                      Start {process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS || '7'}-Day Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Card details required to start the trial • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="border-t border-border/50 px-4 py-20" aria-labelledby="security-title">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h2 id="security-title" className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            How your data is handled
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Receipts are financial records, so here is plainly what happens to them — and
            what you can do about it. Full detail is in the{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              privacy policy
            </Link>
            .
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <Shield className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mb-2 font-semibold text-foreground">Encrypted in transit &amp; at rest</h3>
              <p className="text-sm text-muted-foreground">
                Served over TLS. Sign-in is handled by Clerk and payments by Stripe, so we
                never store your password or card details.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <Cloud className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mb-2 font-semibold text-foreground">Used only to read your receipts</h3>
              <p className="text-sm text-muted-foreground">
                Images go to OpenAI for text extraction and nothing else. Per OpenAI&apos;s
                API terms they are not used to train their models.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mb-2 font-semibold text-foreground">Yours to take or delete</h3>
              <p className="text-sm text-muted-foreground">
                Export everything as CSV or JSON whenever you like, and delete your
                account and its data from Settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-linear-to-br from-primary to-primary/80 px-4 py-20" aria-labelledby="cta-title">
        <div className="mx-auto max-w-4xl text-center">
          <h2 id="cta-title" className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
            Ready to Start Saving?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
            {isLoaded && isSignedIn
              ? 'Start tracking your expenses and take control of your finances today.'
              : 'Try ReceiptWise free for a week. Cancel any time during the trial and you won’t be charged.'
            }
          </p>
          {!isLoaded ? (
            <Skeleton className="mx-auto h-12 w-[200px] rounded-md bg-primary-foreground/20" />
          ) : isSignedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shadow-xl transition-all hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          ) : (
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shadow-xl transition-all hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          )}
        </div>
      </section>
      </main>

      {/* Exit Intent Popup - only for non-signed-in users */}
      {isLoaded && !isSignedIn && <ExitIntentPopup />}
    </div>
  );
}
