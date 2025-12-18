'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@clerk/nextjs';
import { useUser as useUserData } from '@/lib/hooks/use-user';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlayCircle } from 'lucide-react';
import type { HouseholdWithMembers } from '@/lib/types/api-responses';

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { user: userData, isLoading: userDataLoading } = useUserData();
  const { startOnboarding } = useOnboarding();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('none');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  // Update selected household when userData loads
  useEffect(() => {
    if (userData?.defaultHouseholdId) {
      setSelectedHousehold(userData.defaultHouseholdId);
    }
  }, [userData?.defaultHouseholdId]);

  // Fetch user's households
  const { data: households = [], isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      const data = await response.json();
      return data.households || [];
    },
  });

  // Update default household mutation
  const updateDefaultHousehold = useMutation({
    mutationFn: async (householdId: string | null) => {
      const response = await fetch('/api/users/default-household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId }),
      });
      if (!response.ok) throw new Error('Failed to update default household');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Default household updated successfully');
    },
    onError: (error) => {
      console.error('Error updating default household:', error);
      toast.error('Failed to update default household');
    },
  });

  const handleSaveDefaultHousehold = () => {
    const householdId = selectedHousehold === 'none' ? null : selectedHousehold;
    updateDefaultHousehold.mutate(householdId);
  };

  const handleUpgrade = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe checkout
        if (process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS && parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) > 0) {
          toast.success(`Starting your ${process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS}-day free trial...`);
        }
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsUpdating(false);
    }
  };

  // Billing portal mutation
  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to create billing portal session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Error managing subscription:', error);
      toast.error('Failed to open subscription management.');
    },
  });

  const handleManageSubscription = () => {
    billingPortalMutation.mutate();
  };

  const handleExport = async (format: string, type: string) => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/users/export?format=${format}&type=${type}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartspend-export-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Refresh user data to show updated last export time
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isLoaded || userDataLoading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!clerkUser) {
    return null;
  }



  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">Manage your account and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information from Clerk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={clerkUser.fullName || 'Not set'}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                To update your name, please use your Clerk account settings
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={clerkUser.emailAddresses[0]?.emailAddress || 'No email'}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clerk-id">User ID</Label>
              <Input
                id="clerk-id"
                value={clerkUser.id}
                disabled
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your ReceiptWise subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {userData?.subscribed ? 'Premium Plan' : 'Free Plan'}
                      </p>
                      <Badge variant={userData?.subscribed ? 'default' : 'secondary'}>
                        {userData?.subscribed ? 'Premium' : 'Free'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {userData?.subscribed
                        ? 'Unlimited receipts, advanced analytics, and household sharing'
                        : 'View-only access to existing data'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!userData?.subscribed ? (
                    <Button
                      onClick={handleUpgrade}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Processing...' : 'Upgrade to Premium'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={billingPortalMutation.isPending}
                    >
                      {billingPortalMutation.isPending ? 'Loading...' : 'Manage Subscription'}
                    </Button>
                  )}
                </div>
              </div>

              {userData?.subscribed && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-medium text-sm">Premium Features</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Unlimited receipt storage
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Advanced spending analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Household sharing & collaboration
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Priority support
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your ReceiptWise account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">
                  {userData?.updatedAt
                    ? new Date(userData.updatedAt).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Household</CardTitle>
            <CardDescription>
              Set a default household for automatic receipt uploads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-household">Default Household</Label>
              <Select
                value={selectedHousehold}
                onValueChange={setSelectedHousehold}
                disabled={householdsLoading || households.length === 0}
              >
                <SelectTrigger id="default-household">
                  <SelectValue placeholder="Select a household" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Personal receipts only)</SelectItem>
                  {households.map((household: HouseholdWithMembers) => (
                    <SelectItem key={household.id} value={household.id}>
                      {household.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set, newly uploaded receipts will automatically be assigned to this household
              </p>
            </div>
            <Button
              onClick={handleSaveDefaultHousehold}
              disabled={
                updateDefaultHousehold.isPending ||
                selectedHousehold === (userData?.defaultHouseholdId || 'none')
              }
            >
              {updateDefaultHousehold.isPending ? 'Saving...' : 'Save Default Household'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Tour</CardTitle>
            <CardDescription>Learn how to use SmartSpend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a guided tour of SmartSpend's features and learn how to get the most out of the app.
            </p>
            <Button
              variant="outline"
              onClick={startOnboarding}
              className="gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Start Tour
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download your data for backup or tax purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Last Export</span>
                <span className="text-sm text-muted-foreground">
                  {userData?.lastExportedAt
                    ? new Date(userData.lastExportedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Export all your receipts, subscriptions, and payment history in CSV or JSON format.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport('csv', 'all')}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Download CSV (All Data)'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json', 'all')}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Download JSON (All Data)'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv', 'receipts')}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Download Receipts Only'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv', 'subscriptions')}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Download Subscriptions Only'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Deleting your account will permanently remove all your data, including receipts, households, and settings. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete Account (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
