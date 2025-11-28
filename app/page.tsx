"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Receipt, Scan, CreditCard, Users, BarChart3, Shield, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@clerk/nextjs"

const features = [
  {
    icon: Scan,
    title: "AI Receipt Scanning",
    description: "Upload receipts and our AI extracts merchant, amount, date, and line items automatically.",
  },
  {
    icon: BarChart3,
    title: "Spending Analytics",
    description: "Visualize your spending patterns with beautiful charts and category breakdowns.",
  },
  {
    icon: CreditCard,
    title: "Bank Integration",
    description: "Connect Revolut, and other banks to automatically sync transactions.",
  },
  {
    icon: Users,
    title: "Household Sharing",
    description: "Share expenses with family members and track household spending together.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption keeps your financial data safe and private.",
  },
  {
    icon: Receipt,
    title: "Receipt Storage",
    description: "Never lose a receipt again. All your receipts stored and searchable.",
  },
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
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SmartSpend</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Now with AI-powered receipt scanning
          </div>
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Track Every Penny, <span className="text-primary">Effortlessly</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            SmartSpend makes expense tracking simple. Snap receipts, connect your bank, and get insights into your
            spending habits - all in one beautiful app.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start Tracking Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 w-full max-w-5xl">
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
            <img src="/modern-finance-dashboard-with-charts-and-spending-.jpg" alt="SmartSpend Dashboard Preview" className="w-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Manage Expenses
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
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
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl">Take Control of Your Finances</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of users who have simplified their expense tracking with SmartSpend. No more lost
                receipts, no more guessing where your money went.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2">
                    Get Started for Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-xl border bg-card shadow-xl">
                <img src="/mobile-phone-showing-receipt-scanning-app-with-ai-.jpg" alt="SmartSpend Mobile App" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">Ready to Start Saving?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Join SmartSpend today and start tracking your expenses. Free to get started, no credit card required.
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SmartSpend</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SmartSpend. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
