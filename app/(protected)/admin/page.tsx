'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptDetailModal } from '@/components/receipts/receipt-detail-modal';
import { AdminStats } from '@/components/admin/admin-stats';
import { UsersTab } from '@/components/admin/users-tab';
import { HouseholdsTab } from '@/components/admin/households-tab';
import { ReceiptsTab } from '@/components/admin/receipts-tab';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReceiptWithItems, HouseholdWithMembers } from '@/lib/types/api-responses';

interface AdminUser {
  id: string
  email: string
  subscribed: boolean
  isAdmin: boolean
  isBlocked?: boolean
  blockedAt?: string | null
  blockedReason?: string | null
  createdAt: string
  stripeCustomerId: string | null
  receiptCount: number
  householdCount: number
}

interface Household {
  id: string
  name: string
  memberCount: number
  receiptCount: number
  createdAt: string
  ownerEmail: string
}

interface ReceiptDetail {
  id: string
  merchantName: string
  totalAmount: string
  currency: string
  transactionDate: string
  userEmail: string
  householdName: string | null
  processingStatus: string
  createdAt: string
}

// Fetcher functions for React Query
const fetchUsers = async (): Promise<AdminUser[]> => {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

const fetchHouseholds = async (): Promise<Household[]> => {
  const res = await fetch('/api/admin/households');
  if (!res.ok) throw new Error('Failed to fetch households');
  return res.json();
};

const fetchReceipts = async (): Promise<ReceiptDetail[]> => {
  const res = await fetch('/api/admin/receipts');
  if (!res.ok) throw new Error('Failed to fetch receipts');
  return res.json();
};

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithItems | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());
  const [userReceipts, setUserReceipts] = useState<Record<string, ReceiptWithItems[]>>({});
  const [householdDetails, setHouseholdDetails] = useState<Record<string, HouseholdWithMembers>>({});
  const [householdReceipts, setHouseholdReceipts] = useState<Record<string, ReceiptWithItems[]>>({});

  // React Query for data fetching
  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const { data: households = [] } = useQuery({
    queryKey: ['admin', 'households'],
    queryFn: fetchHouseholds,
    enabled: isAdmin,
  });

  const { data: receipts = [], refetch: refetchReceipts } = useQuery({
    queryKey: ['admin', 'receipts'],
    queryFn: fetchReceipts,
    enabled: isAdmin,
  });

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/check');
        if (!response.ok) {
          router.push('/dashboard');
          return;
        }

        const data = await response.json();
        if (!data.isAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  const handleOpenReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`);
      if (response.ok) {
        const receiptData = await response.json();
        setSelectedReceipt(receiptData);
        setIsReceiptModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
    }
  };

  const toggleUserExpansion = async (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
      setExpandedUsers(newExpanded);
    } else {
      newExpanded.add(userId);
      setExpandedUsers(newExpanded);

      // Fetch user's receipts if not already fetched
      if (!userReceipts[userId]) {
        try {
          const response = await fetch(`/api/admin/users/${userId}/receipts`);
          if (response.ok) {
            const data = await response.json();
            setUserReceipts(prev => ({ ...prev, [userId]: data }));
          }
        } catch (error) {
          console.error('Error fetching user receipts:', error);
        }
      }
    }
  };

  const toggleHouseholdExpansion = async (householdId: string) => {
    const newExpanded = new Set(expandedHouseholds);
    if (newExpanded.has(householdId)) {
      newExpanded.delete(householdId);
      setExpandedHouseholds(newExpanded);
    } else {
      newExpanded.add(householdId);
      setExpandedHouseholds(newExpanded);

      // Fetch household details and receipts if not already fetched
      if (!householdDetails[householdId]) {
        try {
          const [detailsRes, receiptsRes] = await Promise.all([
            fetch(`/api/households/${householdId}`),
            fetch(`/api/admin/households/${householdId}/receipts`),
          ]);

          if (detailsRes.ok) {
            const data = await detailsRes.json();
            setHouseholdDetails(prev => ({ ...prev, [householdId]: data }));
          }

          if (receiptsRes.ok) {
            const receipts = await receiptsRes.json();
            setHouseholdReceipts(prev => ({ ...prev, [householdId]: receipts }));
          }
        } catch (error) {
          console.error('Error fetching household details:', error);
        }
      }
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading admin panel">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
            </div>
          </div>
        </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6" aria-labelledby="admin-title">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
          <div>
            <h1 id="admin-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users, households, and receipts
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <AdminStats users={users} households={households} receipts={receipts} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="households">Households</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UsersTab
              users={users}
              expandedUsers={expandedUsers}
              userReceipts={userReceipts}
              onToggleUser={toggleUserExpansion}
              onOpenReceipt={handleOpenReceipt}
            />
          </TabsContent>

          <TabsContent value="households" className="space-y-4">
            <HouseholdsTab
              households={households}
              expandedHouseholds={expandedHouseholds}
              householdDetails={householdDetails}
              householdReceipts={householdReceipts}
              onToggleHousehold={toggleHouseholdExpansion}
              onOpenReceipt={handleOpenReceipt}
            />
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <ReceiptsTab
              receipts={receipts}
              onOpenReceipt={handleOpenReceipt}
              onRefresh={() => refetchReceipts()}
            />
          </TabsContent>
        </Tabs>

        {selectedReceipt && (
          <ReceiptDetailModal
            receipt={selectedReceipt}
            open={isReceiptModalOpen}
            onOpenChange={(open) => {
              setIsReceiptModalOpen(open);
              if (!open) {
                // Refetch receipts when modal closes (in case of deletion/update)
                refetchReceipts();
                setSelectedReceipt(null);
              }
            }}
          />
        )}
      </main>
  );
}
