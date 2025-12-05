"use client"

import { Crown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SubscriptionUpsellProps {
  title?: string
  description?: string
  features?: string[]
  className?: string
}

export function SubscriptionUpsell({
  title = "Upgrade to Premium",
  description = "Subscribe to unlock premium features:",
  features = [
    "Unlimited receipt uploads",
    "Advanced analytics and insights",
    "Household sharing",
    "AI-powered spending analysis"
  ],
  className = ""
}: SubscriptionUpsellProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/settings')
  }

  return (
    <Alert className={`border-primary/50 bg-primary/5 ${className}`}>
      <Crown className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <Button 
          onClick={handleUpgrade}
          size="sm" 
          className="w-full sm:w-auto gap-2"
        >
          <Crown className="h-4 w-4" />
          Upgrade Now
        </Button>
      </AlertDescription>
    </Alert>
  )
}
