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
    staleTime: 5 * 60 * 1000, // 5 minutes - households rarely change
  });
}
