import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

interface TopItem {
  name: string;
  count: number;
  totalSpent: number;
  totalQuantity: number;
  averagePrice: number;
  merchants: string[];
  currency?: string;
  lastPurchased?: string;
  category?: string | null;
  merchantCount?: number;
}

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
  userCurrency?: string;
}

async function analyzeItem(
  itemName: string,
  options?: {
    householdId?: string;
    months?: number;
    userCurrency?: string;
  },
): Promise<ItemAnalysis> {
      // Use the top items endpoint to get all items
      const params = new URLSearchParams({
        limit: '200', // Get more items to find all related ones
        sortBy: 'frequency',
        ...(options?.householdId && { householdId: options.householdId }),
        ...(options?.months && { months: options.months.toString() }),
      });

      const response = await fetch(`/api/receipts/items/top?${params}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[ItemAnalysis] API error:', response.status, errorText);
        throw new Error(`Failed to analyze item (${response.status})`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !Array.isArray(data.topItems)) {
        console.error('[ItemAnalysis] Invalid API response structure:', data);
        throw new Error('Invalid response from server');
      }

      if (data.topItems.length === 0) {
        throw new Error('No purchase data found for analysis');
      }

      // Find all related items (case-insensitive, partial match)
      const normalizedSearchName = itemName.toLowerCase().trim();

      // Try exact match first
      let matchedItems = data.topItems.filter((item: TopItem) => {
        return item.name.toLowerCase().trim() === normalizedSearchName;
      });

      // If no exact match, try partial matching with all words
      if (matchedItems.length === 0) {
        const searchTerms = normalizedSearchName.split(/\s+/).filter(w => w.length > 0);

        matchedItems = data.topItems.filter((item: TopItem) => {
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

      matchedItems.forEach((item: TopItem) => {
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
      const currency = matchedItems[0]?.currency || options?.userCurrency || DEFAULT_CURRENCY;
      const lastPurchased = matchedItems[0]?.lastPurchased || new Date().toISOString().split('T')[0];
      const firstMerchant = matchedItems[0]?.merchants?.[0] || 'Unknown';

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
          date: lastPurchased,
          merchant: firstMerchant,
          quantity: totalQuantity.toString(),
          price: totalSpent.toString(),
          receiptId: '',
        }],
        itemVariants, // Add variants to the response
      };

      return transformedData;
}

export function useItemAnalysis(options: UseItemAnalysisOptions) {
  const { itemName, enabled = true, userCurrency, ...fetchOptions } = options;

  return useQuery({
    queryKey: ['itemAnalysis', itemName, fetchOptions],
    queryFn: () => analyzeItem(itemName, { ...fetchOptions, userCurrency }),
    enabled: enabled && !!itemName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
