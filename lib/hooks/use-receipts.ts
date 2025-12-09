import { useQuery, useQueryClient } from '@tanstack/react-query';

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

interface ReceiptFilters {
  search?: string
  category?: string
  merchant?: string
  minAmount?: string
  maxAmount?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: string
}

export function useReceipts(
  householdId?: string,
  page: number = 1,
  limit: number = 10,
  filters?: ReceiptFilters,
  personalOnly: boolean = false,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['receipts', householdId, page, limit, filters, personalOnly],
    queryFn: async (): Promise<ReceiptsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (householdId) {
        params.append('householdId', householdId);
      }

      if (personalOnly) {
        params.append('personalOnly', 'true');
      }

      // Add filter parameters
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.merchant) {
        params.append('merchant', filters.merchant);
      }
      if (filters?.minAmount) {
        params.append('minAmount', filters.minAmount);
      }
      if (filters?.maxAmount) {
        params.append('maxAmount', filters.maxAmount);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const response = await fetch(`/api/receipts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute - receipts update more frequently
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['receipts', householdId] });
  };

  return {
    receipts: query.data?.receipts || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  };
}

// Hook for getting recent receipts (for dashboard)
export function useRecentReceipts(householdId?: string, limit: number = 5, personalOnly: boolean = false) {
  return useReceipts(householdId, 1, limit, undefined, personalOnly);
}

