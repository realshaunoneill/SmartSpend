'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/use-subscriptions';
import { useHouseholds } from '@/lib/hooks/use-households';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type FormData = {
  name: string;
  description: string;
  category: string;
  amount: string;
  currency: string;
  billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  billingDay: string;
  customFrequencyDays: string;
  startDate: string;
  householdId: string;
  isBusinessExpense: boolean;
  website: string;
  notes: string;
};

const categories = [
  'Streaming',
  'Software',
  'Utilities',
  'Insurance',
  'Cloud Services',
  'Music',
  'Gaming',
  'News',
  'Education',
  'Fitness',
  'Storage',
  'Other',
];

export function CreateSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const { data: households } = useHouseholds();
  const { mutate: createSubscription, isPending } = useCreateSubscription();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      currency: 'EUR',
      billingFrequency: 'monthly',
      billingDay: '1',
      startDate: new Date().toISOString().split('T')[0],
      isBusinessExpense: false,
    },
  });

  const billingFrequency = watch('billingFrequency');

  const onSubmit = (data: FormData) => {
    const amount = parseFloat(data.amount);
    const billingDay = parseInt(data.billingDay);
    const customFrequencyDays = data.customFrequencyDays
      ? parseInt(data.customFrequencyDays)
      : undefined;

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (billingDay < 1 || billingDay > 31) {
      toast({
        title: 'Invalid billing day',
        description: 'Billing day must be between 1 and 31',
        variant: 'destructive',
      });
      return;
    }

    if (
      data.billingFrequency === 'custom' &&
      (!customFrequencyDays || customFrequencyDays < 1)
    ) {
      toast({
        title: 'Invalid custom frequency',
        description: 'Please enter a valid number of days',
        variant: 'destructive',
      });
      return;
    }

    createSubscription(
      {
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        amount,
        currency: data.currency,
        billingFrequency: data.billingFrequency,
        billingDay,
        customFrequencyDays,
        startDate: new Date(data.startDate),
        householdId: data.householdId || undefined,
        isBusinessExpense: data.isBusinessExpense,
        website: data.website || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Subscription created',
            description: `${data.name} has been added to your subscriptions`,
          });
          setOpen(false);
          reset();
        },
        onError: () => {
          toast({
            title: 'Failed to create subscription',
            description: 'Please try again',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Subscription</DialogTitle>
          <DialogDescription>
            Track a recurring expense by adding it to your subscriptions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Netflix, Spotify, etc."
                {...register('name', { required: true })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">Name is required</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Premium plan"
                {...register('description')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
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

          {/* Financial Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  {...register('amount', { required: true })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">Amount is required</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  onValueChange={(value) => setValue('currency', value)}
                  defaultValue="EUR"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="GBP">GBP £</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingFrequency">
                  Billing Frequency <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue('billingFrequency', value as any)
                  }
                  defaultValue="monthly"
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

              <div className="grid gap-2">
                <Label htmlFor="billingDay">
                  Billing Day <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="billingDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  {...register('billingDay', { required: true })}
                />
                {errors.billingDay && (
                  <p className="text-sm text-destructive">
                    Billing day is required (1-31)
                  </p>
                )}
              </div>
            </div>

            {billingFrequency === 'custom' && (
              <div className="grid gap-2">
                <Label htmlFor="customFrequencyDays">
                  Custom Frequency (days){' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customFrequencyDays"
                  type="number"
                  min="1"
                  placeholder="30"
                  {...register('customFrequencyDays')}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: true })}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">Start date is required</p>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            {households && households.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="householdId">Household (Optional)</Label>
                <Select
                  onValueChange={(value) => setValue('householdId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Personal subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {households.map((household: any) => (
                      <SelectItem key={household.id} value={household.id}>
                        {household.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isBusinessExpense">Business Expense</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this as a tax-deductible business expense
                </p>
              </div>
              <Switch
                id="isBusinessExpense"
                checked={watch('isBusinessExpense')}
                onCheckedChange={(checked) =>
                  setValue('isBusinessExpense', checked)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                {...register('website')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this subscription"
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
