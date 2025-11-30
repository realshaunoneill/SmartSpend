import { useQuery, useQueryClient } from "@tanstack/react-query"

export function useReceipts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const response = await fetch("/api/receipts")
      if (!response.ok) {
        throw new Error("Failed to fetch receipts")
      }
      return response.json()
    },
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["receipts"] })
  }

  return {
    receipts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  }
}
