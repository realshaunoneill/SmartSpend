'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  BarChart3,
  CreditCard,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
};

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to SmartSpend! 🎉',
    description: 'Your personal expense tracker and subscription manager',
    icon: <CheckCircle2 className="w-16 h-16 text-primary" />,
    features: [
      'Track receipts and expenses automatically',
      'Manage recurring subscriptions',
      'Get insights into your spending habits',
      'Share expenses with household members',
    ],
  },
  {
    title: 'Upload Receipts',
    description: 'Easily scan and organize your receipts',
    icon: <Upload className="w-16 h-16 text-primary" />,
    features: [
      'Take photos or upload images of receipts',
      'AI automatically extracts items and prices',
      'Batch upload multiple receipts at once',
      'Download receipts anytime you need them',
    ],
  },
  {
    title: 'Track Subscriptions',
    description: 'Never miss a payment or forget a subscription',
    icon: <CreditCard className="w-16 h-16 text-primary" />,
    features: [
      'Add all your recurring subscriptions',
      'Get notified about upcoming payments',
      'Link receipts to subscription payments',
      'See total monthly and yearly costs',
    ],
  },
  {
    title: 'Insights & Analytics',
    description: 'Understand where your money goes',
    icon: <BarChart3 className="w-16 h-16 text-primary" />,
    features: [
      'View spending trends over time',
      'See top purchased items',
      'Analyze spending by category',
      'Track subscription costs and savings',
    ],
  },
  {
    title: 'Household Sharing',
    description: 'Collaborate with family or roommates',
    icon: <Users className="w-16 h-16 text-primary" />,
    features: [
      'Create households and invite members',
      'Share receipts and subscriptions',
      'See combined household expenses',
      'Perfect for families and shared living',
    ],
  },
];

type OnboardingTourProps = {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingTour({ open, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      router.push('/upgrade');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl">{step.title}</DialogTitle>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {onboardingSteps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">{step.icon}</div>

          <DialogDescription className="text-center text-base">
            {step.description}
          </DialogDescription>

          <div className="space-y-3">
            {step.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full">
            {currentStep === 0 ? (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Tour
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
