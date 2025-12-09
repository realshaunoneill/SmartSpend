import { useQuery } from "@tanstack/react-query"
import { useRecentReceipts } from "./use-receipts"

interface DashboardStats {
  totalReceipts: number
  totalSpent: number
  avgSpending: number
  topCategory: string
  spendingByCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  recentReceipts: any[]
}

export function useDashboardStats(householdId?: string, personalOnly: boolean = false) {
  const { receipts, isLoading: receiptsLoading } = useRecentReceipts(householdId, 100, personalOnly) // Get more for stats

  const stats = useQuery({
    queryKey: ["dashboard-stats", householdId, personalOnly, receipts?.length],
    queryFn: () => {
      if (!receipts || receipts.length === 0) {
        return {
          totalReceipts: 0,
          totalSpent: 0,
          avgSpending: 0,
          topCategory: "No data",
          spendingByCategory: [],
          recentReceipts: [],
        }
      }

      // Calculate total spent
      const totalSpent = receipts.reduce((sum: number, receipt: any) => {
        return sum + (parseFloat(receipt.total_amount) || 0)
      }, 0)

      // Calculate spending by category
      const categoryTotals: Record<string, number> = {}
      receipts.forEach((receipt: any) => {
        const category = receipt.category || "other"
        categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(receipt.total_amount) || 0)
      })

      // Convert to array and calculate percentages
      const spendingByCategory = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)

      // Find top category
      const topCategory = spendingByCategory.length > 0 
        ? spendingByCategory[0].category 
        : "No data"

      // Get recent receipts (last 5)
      const recentReceipts = [...receipts]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      return {
        totalReceipts: receipts.length,
        totalSpent,
        avgSpending: receipts.length > 0 ? totalSpent / receipts.length : 0,
        topCategory,
        spendingByCategory,
        recentReceipts,
      }
    },
    enabled: !receiptsLoading && !!receipts,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard stats are derived from receipts
  })

  return {
    stats: stats.data,
    isLoading: receiptsLoading || stats.isLoading,
    error: stats.error,
  }
}