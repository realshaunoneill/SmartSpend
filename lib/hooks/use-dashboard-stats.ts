import { useQuery } from '@tanstack/react-query';
import { useRecentReceipts } from './use-receipts';
import type { ReceiptWithItems } from '@/lib/types/api-responses';

export function useDashboardStats(householdId?: string, personalOnly: boolean = false) {
  const { receipts, isLoading: receiptsLoading } = useRecentReceipts(householdId, 100, personalOnly); // Get more for stats

  const stats = useQuery({
    queryKey: ['dashboard-stats', householdId, personalOnly, receipts?.length],
    queryFn: () => {
      if (!receipts || receipts.length === 0) {
        return {
          totalReceipts: 0,
          totalSpent: 0,
          avgSpending: 0,
          topCategory: 'No data',
          spendingByCategory: [],
          recentReceipts: [],
        };
      }

      // Calculate total spent
      const totalSpent = receipts.reduce((sum: number, receipt: ReceiptWithItems) => {
        return sum + (parseFloat(receipt.totalAmount || '0') || 0);
      }, 0);

      // Calculate spending by category
      const categoryTotals: Record<string, number> = {};
      receipts.forEach((receipt: ReceiptWithItems) => {
        const category = receipt.category || 'other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(receipt.totalAmount || '0') || 0);
      });

      // Convert to array and calculate percentages
      const spendingByCategory = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Find top category
      const topCategory = spendingByCategory.length > 0
        ? spendingByCategory[0].category
        : 'No data';

      // Get recent receipts (last 5)
      const recentReceipts = [...receipts]
        .sort((a: ReceiptWithItems, b: ReceiptWithItems) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

      return {
        totalReceipts: receipts.length,
        totalSpent,
        avgSpending: receipts.length > 0 ? totalSpent / receipts.length : 0,
        topCategory,
        spendingByCategory,
        recentReceipts,
      };
    },
    enabled: !receiptsLoading && !!receipts,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard stats are derived from receipts
  });

  return {
    stats: stats.data,
    isLoading: receiptsLoading || stats.isLoading,
    error: stats.error,
  };
}
