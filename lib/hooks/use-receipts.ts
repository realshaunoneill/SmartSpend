import { useQuery, useQueryClient } from "@tanstack/react-query"

interface ReceiptsResponse {
  receipts: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useReceipts(householdId?: string, page: number = 1, limit: number = 10, personalOnly: boolean = false) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["receipts", householdId, page, limit, personalOnly],
    queryFn: async (): Promise<ReceiptsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (householdId) {
        params.append("householdId", householdId)
      }
      
      if (personalOnly) {
        params.append("personalOnly", "true")
      }
      
      const response = await fetch(`/api/receipts?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch receipts")
      }
      return response.json()
    },
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["receipts", householdId] })
  }

  return {
    receipts: query.data?.receipts || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  }
}

// Hook for getting recent receipts (for dashboard)
export function useRecentReceipts(householdId?: string, limit: number = 5, personalOnly: boolean = false) {
  return useReceipts(householdId, 1, limit, personalOnly)
}
