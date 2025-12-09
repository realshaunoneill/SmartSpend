'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCard } from './user-card';
import type { ReceiptWithItems } from '@/lib/types/api-responses';

// Admin-specific user type with aggregated data
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

interface UsersTabProps {
  users: AdminUser[];
  expandedUsers: Set<string>;
  userReceipts: Record<string, ReceiptWithItems[]>;
  onToggleUser: (userId: string) => void;
  onOpenReceipt: (receiptId: string) => void;
}

export function UsersTab({
  users,
  expandedUsers,
  userReceipts,
  onToggleUser,
  onOpenReceipt,
}: UsersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>View and manage user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isExpanded={expandedUsers.has(user.id)}
              onToggle={() => onToggleUser(user.id)}
              userReceipts={userReceipts[user.id]}
              onOpenReceipt={onOpenReceipt}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
