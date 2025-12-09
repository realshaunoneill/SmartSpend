'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Receipt, Home } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  subscribed: boolean;
  isAdmin: boolean;
  createdAt: string;
  stripeCustomerId: string | null;
  receiptCount: number;
  householdCount: number;
}

interface AdminHousehold {
  id: string;
  name: string;
  memberCount: number;
  receiptCount: number;
  createdAt: string;
}

interface AdminReceipt {
  id: string;
  merchantName: string;
  totalAmount: string;
  currency: string;
  transactionDate: string;
  userEmail: string;
  householdName: string | null;
  processingStatus: string;
  createdAt: string;
}

interface AdminStatsProps {
  users: AdminUser[]
  households: AdminHousehold[]
  receipts: AdminReceipt[]
}

export function AdminStats({ users, households, receipts }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.length}</div>
          <p className="text-xs text-muted-foreground">
            {users.filter(u => u.subscribed).length} subscribed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Households</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{households.length}</div>
          <p className="text-xs text-muted-foreground">
            {households.reduce((sum, h) => sum + h.memberCount, 0)} total members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{receipts.length}</div>
          <p className="text-xs text-muted-foreground">
            {receipts.filter(r => r.processingStatus === 'completed').length} processed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
