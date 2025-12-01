"use client"

import { useState } from "react"
import { X, Crown, Sparkles, ArrowRight, Users, BarChart3, Receipt, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/hooks/use-user"

interface SubscriptionBannerProps {
  page?: string
}

const pageMessages = {
  dashboard: {
    title: "Unlock Advanced Analytics",
    description: "Get detailed spending insights, trends, and unlimited receipt storage",
    features: ["Unlimited receipts", "Advanced charts", "Export data"]
  },
  receipts: {
    title: "Store Unlimited Receipts",
    description: "Never worry about storage limits with Premium receipt management",
    features: ["Unlimited storage", "Smart categorization", "OCR enhancement"]
  },
  sharing: {
    title: "Enhanced Household Sharing",
    description: "Create unlimited households and collaborate with more family members",
    features: ["Unlimited households", "Advanced permissions", "Real-time sync"]
  },
  bank: {
    title: "Premium Bank Integration",
    description: "Connect multiple bank accounts and get automatic transaction matching",
    features: ["Multiple banks", "Auto-matching", "Transaction insights"]
  },
  settings: {
    title: "Premium Account Features",
    description: "Unlock all premium features and priority support",
    features: ["Priority support", "Advanced settings", "Data export"]
  },
  default: {
    title: "Upgrade to Premium",
    description: "Unlock unlimited receipts, advanced analytics, and household sharing",
    features: ["Unlimited receipts", "Advanced analytics", "Household sharing"]
  }
}

export function SubscriptionBanner({ page = "default" }: SubscriptionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { user, isSubscribed } = useUser()

  // Don't show banner if user is subscribed, dismissed, or not loaded
  if (isSubscribed || isDismissed || !user) {
    return null
  }

  const message = pageMessages[page as keyof typeof pageMessages] || pageMessages.default

  const handleSubscribe = async () => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <Card className="mx-4 mb-6 border-2 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/30">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground text-lg">{message.title}</h3>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {message.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {message.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={handleSubscribe} className="gap-2 shadow-sm">
              <Zap className="h-4 w-4" />
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 hover:bg-background/50"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}