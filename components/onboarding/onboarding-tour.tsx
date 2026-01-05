'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  BarChart3,
  CreditCard,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Download,
  ChevronLeft,
  Gift,
  Check,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from '@/lib/utils/currency';

type PricingDetails = {
  monthly: {
    priceId: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    productName: string;
    productDescription: string | null;
    active: boolean;
  };
  annual: {
    priceId: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    productName: string;
    productDescription: string | null;
    active: boolean;
  } | null;
};

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  icon: typeof Upload;
  color: string;
  bgColor: string;
  features?: Array<{ icon: typeof Sparkles; text: string }>;
  pricing?: boolean;
  cta?: boolean;
  currencySelect?: boolean;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to ReceiptWise! 🎉',
    description: 'The expense tracker built for sharing. Perfect for families, roommates, and couples.',
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: [
      { icon: Users, text: 'Share expenses with family & roommates' },
      { icon: Zap, text: 'AI-powered receipt scanning' },
      { icon: Shield, text: 'Secure & encrypted data' },
      { icon: BarChart3, text: 'Powerful spending insights' },
    ],
  },
  {
    id: 2,
    title: 'Select Your Currency',
    description: 'Choose your preferred currency for displaying amounts throughout the app.',
    icon: Globe,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    currencySelect: true,
  },
  {
    id: 3,
    title: 'Household Sharing',
    description: 'Create households for your family, roommates, or partner. Everyone can upload and view receipts together.',
    icon: Users,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: [
      { icon: Users, text: 'Unlimited household members' },
      { icon: Upload, text: 'Everyone can upload receipts' },
      { icon: BarChart3, text: 'See combined spending' },
      { icon: Shield, text: 'Perfect for shared expenses' },
    ],
  },
  {
    id: 4,
    title: 'Upload & Scan Receipts',
    description: 'Easily capture and organize all your receipts with intelligent AI extraction.',
    icon: Upload,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      { icon: Upload, text: 'Take photos or upload images' },
      { icon: Sparkles, text: 'AI extracts items & prices automatically' },
      { icon: Zap, text: 'Batch upload multiple receipts' },
      { icon: Download, text: 'All household members can access' },
    ],
  },
  {
    id: 5,
    title: 'Track Subscriptions',
    description: 'Never miss a payment or forget about a shared subscription again.',
    icon: CreditCard,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: [
      { icon: CreditCard, text: 'Track all recurring subscriptions' },
      { icon: Users, text: 'Share subscription costs with household' },
      { icon: CheckCircle2, text: 'Link receipts to payments' },
      { icon: BarChart3, text: 'See total monthly costs' },
    ],
  },
  {
    id: 6,
    title: 'Insights & Analytics',
    description: 'Understand your household spending patterns with powerful analytics and visualizations.',
    icon: BarChart3,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      { icon: BarChart3, text: 'View spending trends over time' },
      { icon: Users, text: 'See who spent what in your household' },
      { icon: CreditCard, text: 'Analyze by category' },
      { icon: Sparkles, text: 'AI-powered spending insights' },
    ],
  },
  {
    id: 7,
    title: 'Get Started with Premium',
    description: 'Unlock unlimited receipts, households, and advanced features. Perfect for families sharing expenses.',
    icon: Gift,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    pricing: true,
    cta: true,
  },
];

type OnboardingTourProps = {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingTour({ open, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricingDetails, setPricingDetails] = useState<PricingDetails | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);

  // Fetch pricing details when component mounts and dialog is open
  useEffect(() => {
    if (!open) return;

    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (!response.ok) {
          throw new Error('Failed to fetch pricing');
        }
        const data = await response.json();
        setPricingDetails(data);
      } catch (error) {
        console.error('Error fetching pricing:', error);
        toast.error('Failed to load pricing information.');
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchPricing();
  }, [open]);

  // Reset step when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setIsProcessing(false);
    }
  }, [open]);

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  // Format currency
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Save currency preference
  const saveCurrency = async () => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency }),
      });
      if (!response.ok) {
        throw new Error('Failed to save currency');
      }
    } catch (error) {
      console.error('Error saving currency:', error);
      // Don't block the flow, just log the error
    }
  };

  const handleNext = async () => {
    // If we're on the currency step, save the currency preference
    if (step.currencySelect) {
      await saveCurrency();
    }

    if (isLastStep) {
      // Last step is pricing, which has its own CTAs
      // This shouldn't be called for the pricing step
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    await onSkip();
  };

  const handleStartTrial = async () => {
    setIsProcessing(true);
    try {
      // Use annual price if available, otherwise monthly
      const priceId = pricingDetails?.annual?.priceId || pricingDetails?.monthly?.priceId;

      if (!priceId) {
        throw new Error('No pricing information available');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        // Complete onboarding before redirecting
        await onComplete();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;

  const handleClose = async () => {
    await handleSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">
          {step.title} - ReceiptWise Onboarding
        </DialogTitle>

        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-4 sm:p-8 pt-8 sm:pt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Icon */}
                <div className={cn('w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center', step.bgColor)}>
                  <Icon className={cn('w-6 h-6 sm:w-8 sm:h-8', step.color)} />
                </div>

                {/* Title and Description */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{step.title}</h2>
                  <p className="text-muted-foreground text-base sm:text-lg">{step.description}</p>
                </div>

                {/* Features */}
                {step.features && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-4">
                    {step.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-muted/50"
                      >
                        <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Currency Selection */}
                {step.currencySelect && (
                  <div className="py-4 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-medium">Select your currency</label>
                      <Select
                        value={selectedCurrency}
                        onValueChange={(value) => setSelectedCurrency(value as CurrencyCode)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This will be used to display amounts in your dashboard and reports. You can change this later in Settings.
                        Don&apos;t see your currency? <a href="mailto:support@receiptwise.app" className="text-primary hover:underline">Email us</a> and we&apos;ll add it!
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* Pricing Section */}
                {step.pricing && (
                  <div className="space-y-4 py-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative p-6 rounded-lg border-2 border-primary bg-linear-to-br from-primary/5 to-primary/10"
                    >
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                        Premium Plan
                      </Badge>

                      <div className="text-center space-y-4 mt-2">
                        <div>
                          {isLoadingPrice ? (
                            <div className="space-y-2">
                              <Skeleton className="h-12 w-32 mx-auto" />
                              <Skeleton className="h-4 w-24 mx-auto" />
                            </div>
                          ) : pricingDetails ? (
                            <>
                              {pricingDetails.annual ? (
                                <>
                                  <div className="text-4xl font-bold text-primary">
                                    {formatPrice(pricingDetails.annual.amount / 12, pricingDetails.annual.currency)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    per month
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatPrice(pricingDetails.annual.amount, pricingDetails.annual.currency)} billed annually
                                  </div>
                                  <Badge variant="secondary" className="mt-2">
                                    Save 2 months (17% off)
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <div className="text-4xl font-bold text-primary">
                                    {formatPrice(pricingDetails.monthly.amount, pricingDetails.monthly.currency)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    per {pricingDetails.monthly.interval}
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-4xl font-bold text-primary">€1.66</div>
                              <div className="text-sm text-muted-foreground">per month</div>
                              <div className="text-xs text-muted-foreground mt-1">€19.99 billed annually</div>
                            </>
                          )}
                          {trialDays > 0 && (
                            <Badge variant="default" className="mt-2">
                              {trialDays}-day free trial
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-left">
                          {[
                            'Perfect for families & roommates',
                            'Unlimited receipt uploads',
                            'Unlimited household sharing',
                            'Advanced analytics & insights',
                            'Track shared subscriptions',
                            'Export data anytime',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={handleStartTrial}
                            disabled={isProcessing}
                            size="lg"
                            className="w-full"
                          >
                            {isProcessing ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Processing...</span>
                              </div>
                            ) : trialDays > 0 ? (
                              <>
                                <Gift className="w-4 h-4 mr-2" />
                                Start {trialDays}-Day Free Trial
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Subscribe Now
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleSkip()}
                            disabled={isProcessing}
                            variant="ghost"
                            size="lg"
                            className="w-full"
                          >
                            Continue without Premium
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          {trialDays > 0
                            ? `Try Premium free for ${trialDays} days. Cancel anytime.`
                            : 'Cancel anytime. No long-term contracts.'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Step indicators */}
                <div className="flex justify-center gap-2 py-4">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        index === currentStep
                          ? 'w-8 bg-primary'
                          : index < currentStep
                          ? 'w-2 bg-primary/50'
                          : 'w-2 bg-muted',
                      )}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isProcessing}
                        size="sm"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Back</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleSkip()}
                      disabled={isProcessing}
                      size="sm"
                    >
                      Skip tutorial
                    </Button>
                  </div>
                  {!step.pricing && (
                    <Button
                      onClick={handleNext}
                      size="sm"
                      className="min-w-24 sm:min-w-32"
                    >
                      {isLastStep ? 'Get Started' : 'Next'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
