'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { AuthenticatedPage } from '@/components/layout/authenticated-page';
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

export default function AdminPage() {
  return (
    <AuthenticatedPage>
      <AdminContent />
    </AuthenticatedPage>
  );
}

function AdminContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [receipts, setReceipts] = useState<ReceiptDetail[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithItems | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());
  const [userReceipts, setUserReceipts] = useState<Record<string, ReceiptWithItems[]>>({});
  const [householdDetails, setHouseholdDetails] = useState<Record<string, HouseholdWithMembers>>({});
  const [householdReceipts, setHouseholdReceipts] = useState<Record<string, ReceiptWithItems[]>>({});

  useEffect(() => {
    async function checkAdminAndFetchData() {
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

        // Fetch all admin data
        const [usersRes, householdsRes, receiptsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/households'),
          fetch('/api/admin/receipts'),
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (householdsRes.ok) setHouseholds(await householdsRes.json());
        if (receiptsRes.ok) setReceipts(await receiptsRes.json());
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndFetchData();
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
      <>
        <Navigation />
        <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
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
            />
          </TabsContent>
        </Tabs>
      </main>
      {selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          open={isReceiptModalOpen}
          onOpenChange={setIsReceiptModalOpen}
        />
      )}
    </>
  );
}
