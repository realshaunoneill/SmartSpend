import { useQuery } from '@tanstack/react-query';

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) {
        throw new Error('Failed to fetch households');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - households rarely change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });
}
