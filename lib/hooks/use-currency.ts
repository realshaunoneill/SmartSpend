'use client';

import { useUser } from '@/lib/hooks/use-user';
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY, type CurrencyCode } from '@/lib/utils/currency';

/**
 * Hook to get user's currency preference and formatting functions
 */
export function useCurrency() {
  const { user } = useUser();

  const currency = (user?.currency as CurrencyCode) || DEFAULT_CURRENCY;

  return {
    currency,
    symbol: getCurrencySymbol(currency),
    format: (amount: number) => formatCurrency(amount, currency),
  };
}
