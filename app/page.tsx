"use client"

import Link from "next/link"
import { Receipt, Scan, CreditCard, Users, BarChart3, Shield, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Navigation } from "@/components/layout/navigation"
import { useUser } from "@clerk/nextjs"

const features = [
  {
    icon: Scan,
    title: "AI Receipt Scanning",
    description: "Upload receipts and our AI extracts merchant, amount, date, and line items automatically.",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    icon: BarChart3,
    title: "Spending Analytics",
    description: "Visualize your spending patterns with beautiful charts and category breakdowns.",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: CreditCard,
    title: "Bank Integration",
    description: "Connect your bank accounts to automatically sync transactions in real-time.",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: Users,
    title: "Household Sharing",
    description: "Share expenses with family members and track household spending together.",
    gradient: "from-orange-500/10 to-amber-500/10",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption keeps your financial data safe and private.",
    gradient: "from-red-500/10 to-rose-500/10",
  },
  {
    icon: Receipt,
    title: "Receipt Storage",
    description: "Never lose a receipt again. All your receipts stored and searchable.",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
]

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500K+", label: "Receipts Scanned" },
  { value: "99.9%", label: "Uptime" },
  { value: "$2M+", label: "Tracked Spending" },
]

const benefits = [
  "Track all expenses in one place",
  "Automatic categorization",
  "Export reports for taxes",
  "Set budget alerts",
  "Multi-currency support",
  "Works on all devices",
]

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      {isLoaded && isSignedIn ? (
        <Navigation />
      ) : (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="ReceiptWise" className="h-8 w-auto" />
              <span className="text-xl font-bold text-foreground">ReceiptWise</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/sign-in">
                <Button className="shadow-lg shadow-primary/20">Login</Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent dark:from-primary/10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now with AI-powered receipt scanning
          </div>
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Track Every Penny,{" "}
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            ReceiptWise makes expense tracking simple. Snap receipts, connect your bank, and get insights into your
            spending habits—all in one beautiful app.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isSignedIn ? (
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
                    Start Tracking Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="gap-2 border-border/50 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4" />
                  See How It Works
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mx-auto mt-20 w-full max-w-6xl">
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-accent/5" />
            <div className="aspect-video w-full bg-linear-to-br from-muted/50 to-muted/30">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Features
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Everything You Need to Manage Expenses
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
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
              )
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
                Take Control of Your Finances
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of users who have simplified their expense tracking with ReceiptWise. No more lost
                receipts, no more guessing where your money went.
              </p>
              <ul className="mb-8 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    Get Started for Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-20 blur-2xl" />
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm">
                  <div className="aspect-[4/5] w-full bg-gradient-to-br from-muted/50 to-muted/30">
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <Receipt className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Mobile App Preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Your Data is Safe with Us
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            We use bank-level encryption and security measures to protect your financial data. Your privacy is our top priority.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <Shield className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold text-foreground">256-bit Encryption</h3>
              <p className="text-sm text-muted-foreground">Military-grade security</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold text-foreground">SOC 2 Compliant</h3>
              <p className="text-sm text-muted-foreground">Industry standards</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold text-foreground">GDPR Ready</h3>
              <p className="text-sm text-muted-foreground">Privacy compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Coming Soon Section */}
      <section className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-8 shadow-xl backdrop-blur-sm sm:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.1),transparent_70%)]" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Coming Soon
                </div>
                <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                  ReceiptWise Mobile App
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Track expenses on the go with our upcoming mobile app. Snap receipts instantly, view your spending in real-time, and manage your finances from anywhere.
                </p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Instant receipt capture with camera</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Real-time sync across all devices</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Offline mode for on-the-go tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Push notifications for spending alerts</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
                      <svg className="h-5 w-5 text-background" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Download on the</div>
                      <div className="text-sm font-semibold text-foreground">App Store</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
                      <svg className="h-5 w-5 text-background" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Get it on</div>
                      <div className="text-sm font-semibold text-foreground">Google Play</div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Sign up now to be notified when the mobile app launches
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-30 blur-3xl" />
                <div className="relative mx-auto max-w-sm">
                  <div className="overflow-hidden rounded-3xl border-8 border-foreground/10 bg-card shadow-2xl">
                    <div className="aspect-[9/19] w-full bg-gradient-to-br from-muted/50 to-muted/30">
                      <div className="flex h-full flex-col items-center justify-center p-8">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                          <Receipt className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="mb-2 text-center text-lg font-semibold text-foreground">ReceiptWise</h3>
                        <p className="text-center text-sm text-muted-foreground">Mobile App</p>
                        <div className="mt-8 flex gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                          <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-75" />
                          <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-gradient-to-br from-primary to-primary/80 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
            Ready to Start Saving?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
            {isSignedIn 
              ? "Start tracking your expenses and take control of your finances today."
              : "Join ReceiptWise today and start tracking your expenses. Free to get started, no credit card required."
            }
          </p>
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 shadow-xl transition-all hover:scale-105"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/sign-up">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 shadow-xl transition-all hover:scale-105"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 px-4 py-12 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="mb-8 flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ReceiptWise" className="h-8 w-auto" />
              <span className="text-xl font-bold text-foreground">ReceiptWise</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="transition-colors hover:text-foreground">Privacy</Link>
              <Link href="#" className="transition-colors hover:text-foreground">Terms</Link>
              <Link href="#" className="transition-colors hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ReceiptWise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
