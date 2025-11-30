import { useQuery, useQueryClient } from "@tanstack/react-query"

export function useReceipts(householdId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["receipts", householdId],
    queryFn: async () => {
      const url = householdId 
        ? `/api/receipts?householdId=${householdId}`
        : "/api/receipts"
      
      const response = await fetch(url)
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
    receipts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  }
}
