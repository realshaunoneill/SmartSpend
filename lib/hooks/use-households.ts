import { useQuery } from "@tanstack/react-query";

export function useHouseholds() {
  return useQuery({
    queryKey: ["households"],
    queryFn: async () => {
      const response = await fetch("/api/households");
      if (!response.ok) {
        throw new Error("Failed to fetch households");
      }
      return response.json();
    },
  });
}