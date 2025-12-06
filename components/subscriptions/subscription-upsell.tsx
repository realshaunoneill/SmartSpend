"use client"

import { Crown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className={`border-primary/50 bg-primary/5 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          onClick={handleUpgrade}
          className="w-full sm:w-auto gap-2"
        >
          <Crown className="h-4 w-4" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  )
}
