import { useQuery } from "@tanstack/react-query";

export interface ItemAnalysis {
  itemName: string;
  searchPeriod: {
    startDate: string;
    endDate: string;
    months: number;
  };
  summary: {
    totalPurchases: number;
    totalSpent: number;
    totalQuantity: number;
    averagePrice: number;
    averageQuantity: number;
    currency: string;
  };
  topMerchants: Array<{
    merchant: string;
    count: number;
    total: number;
    average: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    total: number;
    average: number;
  }>;
  recentPurchases: Array<{
    date: string;
    merchant: string;
    quantity: string;
    price: string;
    receiptId: string;
  }>;
  itemVariants?: Array<{
    name: string;
    count: number;
    totalSpent: number;
    averagePrice: number;
    merchants: string[];
  }>;
}

interface UseItemAnalysisOptions {
  itemName: string;
  householdId?: string;
  months?: number;
  enabled?: boolean;
}

async function analyzeItem(
  itemName: string,
  options?: {
    householdId?: string;
    months?: number;
  }
): Promise<ItemAnalysis> {
      // Use the top items endpoint to get all items
      const params = new URLSearchParams({
        limit: "200", // Get more items to find all related ones
        sortBy: "frequency",
        ...(options?.householdId && { householdId: options.householdId }),
        ...(options?.months && { months: options.months.toString() }),
      });

      const response = await fetch(`/api/receipts/items/top?${params}`);

      if (!response.ok) {
        throw new Error("Failed to analyze item");
      }

      const data = await response.json();
      
      // Find all related items (case-insensitive, partial match)
      const normalizedSearchName = itemName.toLowerCase().trim();
      
      // Try exact match first
      let matchedItems = data.topItems.filter((item: any) => {
        return item.name.toLowerCase().trim() === normalizedSearchName;
      });

      // If no exact match, try partial matching with all words
      if (matchedItems.length === 0) {
        const searchTerms = normalizedSearchName.split(/\s+/).filter(w => w.length > 0);
        
        matchedItems = data.topItems.filter((item: any) => {
          const itemNameLower = item.name.toLowerCase().trim();
          // Match if item contains all search words or search term contains the item name
          return searchTerms.every(term => itemNameLower.includes(term)) ||
                 itemNameLower.includes(normalizedSearchName) ||
                 normalizedSearchName.includes(itemNameLower);
        });
      }

      if (matchedItems.length === 0) {
        throw new Error(`No data found for "${itemName}"`);
      }

      // Aggregate all matched items
      let totalPurchases = 0;
      let totalSpent = 0;
      let totalQuantity = 0;
      const merchantsSet = new Set<string>();
      const itemVariants: Array<{
        name: string;
        count: number;
        totalSpent: number;
        averagePrice: number;
        merchants: string[];
      }> = [];

      matchedItems.forEach((item: any) => {
        totalPurchases += item.count;
        totalSpent += item.totalSpent;
        totalQuantity += item.totalQuantity;
        item.merchants.forEach((m: string) => merchantsSet.add(m));
        
        itemVariants.push({
          name: item.name,
          count: item.count,
          totalSpent: item.totalSpent,
          averagePrice: item.averagePrice,
          merchants: item.merchants || [],
        });
      });

      // Sort variants by frequency
      itemVariants.sort((a, b) => b.count - a.count);

      const averagePrice = totalSpent / totalPurchases;
      const currency = matchedItems[0].currency;

      // Transform the data to match the expected ItemAnalysis format
      const transformedData: ItemAnalysis = {
        itemName: matchedItems.length > 1 
          ? `${itemName} (${matchedItems.length} variants)` 
          : matchedItems[0].name,
        searchPeriod: data.summary.period,
        summary: {
          totalPurchases,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          totalQuantity: parseFloat(totalQuantity.toFixed(2)),
          averagePrice: parseFloat(averagePrice.toFixed(2)),
          averageQuantity: totalQuantity / totalPurchases,
          currency,
        },
        topMerchants: Array.from(merchantsSet).map((merchant) => ({
          merchant,
          count: 0,
          total: 0,
          average: averagePrice,
        })),
        monthlyTrend: [],
        recentPurchases: [{
          date: matchedItems[0].lastPurchased,
          merchant: matchedItems[0].merchants[0] || "Unknown",
          quantity: totalQuantity.toString(),
          price: totalSpent.toString(),
          receiptId: "",
        }],
        itemVariants, // Add variants to the response
      };

      return transformedData;
}

export function useItemAnalysis(options: UseItemAnalysisOptions) {
  const { itemName, enabled = true, ...fetchOptions } = options;

  return useQuery({
    queryKey: ["itemAnalysis", itemName, fetchOptions],
    queryFn: () => analyzeItem(itemName, fetchOptions),
    enabled: enabled && !!itemName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
