'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSubscription } from '@/hooks/use-subscriptions';
import { useHouseholds } from '@/lib/hooks/use-households';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { type Subscription } from '@/lib/db/schema';

type EditSubscriptionDialogProps = {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormData = {
  name: string;
  description: string;
  category: string;
  amount: string;
  currency: string;
  billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  billingDay: string;
  customFrequencyDays: string;
  website: string;
  notes: string;
  isBusinessExpense: boolean;
};

const categories = [
  'Streaming',
  'Software',
  'Utilities',
  'Insurance',
  'Fitness',
  'Food & Meal Kits',
  'News & Magazines',
  'Cloud Storage',
  'Music',
  'Gaming',
  'Education',
  'Healthcare',
  'Other',
];

export function EditSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: EditSubscriptionDialogProps) {
  const { mutate: updateSubscription, isPending } = useUpdateSubscription(subscription.id);
  const { toast } = useToast();
  const { data: households = [] } = useHouseholds();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: subscription.name,
      description: subscription.description || '',
      category: subscription.category || '',
      amount: subscription.amount,
      currency: subscription.currency,
      billingFrequency: subscription.billingFrequency as any,
      billingDay: subscription.billingDay.toString(),
      customFrequencyDays: subscription.customFrequencyDays?.toString() || '',
      website: subscription.website || '',
      notes: subscription.notes || '',
      isBusinessExpense: subscription.isBusinessExpense || false,
    },
  });

  const billingFrequency = watch('billingFrequency');
  const isBusinessExpense = watch('isBusinessExpense');

  // Reset form when subscription changes
  useEffect(() => {
    reset({
      name: subscription.name,
      description: subscription.description || '',
      category: subscription.category || '',
      amount: subscription.amount,
      currency: subscription.currency,
      billingFrequency: subscription.billingFrequency as any,
      billingDay: subscription.billingDay.toString(),
      customFrequencyDays: subscription.customFrequencyDays?.toString() || '',
      website: subscription.website || '',
      notes: subscription.notes || '',
      isBusinessExpense: subscription.isBusinessExpense || false,
    });
  }, [subscription, reset]);

  const onSubmit = (data: FormData) => {
    updateSubscription(
      {
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        amount: parseFloat(data.amount),
        currency: data.currency,
        billingFrequency: data.billingFrequency,
        billingDay: parseInt(data.billingDay),
        customFrequencyDays: data.billingFrequency === 'custom' ? parseInt(data.customFrequencyDays) : undefined,
        website: data.website || undefined,
        notes: data.notes || undefined,
        isBusinessExpense: data.isBusinessExpense,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Subscription updated',
            description: `${data.name} has been updated successfully`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Failed to update subscription',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update the subscription details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Subscription Name *</Label>
              <Input
                id="name"
                placeholder="Netflix, Spotify, etc."
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                {...register('description')}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                  })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={watch('currency')}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingFrequency">Billing Frequency *</Label>
                <Select
                  value={watch('billingFrequency')}
                  onValueChange={(value) => setValue('billingFrequency', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="billingDay">Billing Day *</Label>
                <Input
                  id="billingDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  {...register('billingDay', {
                    required: 'Billing day is required',
                    min: { value: 1, message: 'Day must be between 1-31' },
                    max: { value: 31, message: 'Day must be between 1-31' },
                  })}
                />
                {errors.billingDay && (
                  <p className="text-sm text-destructive mt-1">{errors.billingDay.message}</p>
                )}
              </div>
            </div>

            {billingFrequency === 'custom' && (
              <div>
                <Label htmlFor="customFrequencyDays">Custom Frequency (Days) *</Label>
                <Input
                  id="customFrequencyDays"
                  type="number"
                  min="1"
                  placeholder="30"
                  {...register('customFrequencyDays', {
                    required: billingFrequency === 'custom' ? 'Custom frequency is required' : false,
                    min: { value: 1, message: 'Must be at least 1 day' },
                  })}
                />
                {errors.customFrequencyDays && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.customFrequencyDays.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                {...register('website')}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes"
                {...register('notes')}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isBusinessExpense"
                checked={isBusinessExpense}
                onCheckedChange={(checked) => setValue('isBusinessExpense', checked)}
              />
              <Label htmlFor="isBusinessExpense" className="cursor-pointer">
                Business Expense
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
