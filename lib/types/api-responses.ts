import type { Receipt, ReceiptItem, Household, Subscription, SubscriptionPayment } from '@/lib/db/schema';

// Receipt with items
export type ReceiptWithItems = Receipt & {
  items?: ReceiptItem[];
  submittedBy?: string;
  linkedSubscription?: {
    id: string;
    subscriptionId: string;
    expectedDate: string;
    expectedAmount: string;
    status: string;
    subscription: {
      id: string;
      name: string;
      amount: string;
      currency: string;
      billingFrequency: string;
      status: string;
      isBusinessExpense: boolean;
    };
  } | null;
};

// Household with member info
export type HouseholdWithMembers = Household & {
  memberCount?: number;
  isAdmin?: boolean;
  isDefault?: boolean;
};

// Member with user info
export type MemberWithUser = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'owner' | 'member';
  joined_at: string;
};

// OCR Item from OpenAI response
export type OCRItem = {
  name: string;
  quantity?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  price?: number | string;
  category?: string;
  description?: string;
  modifiers?: Array<{
    name: string;
    price: number | string;
    type?: string;
  }>;
};

// OCR Data structure from OpenAI
export type OCRData = {
  merchant?: string;
  merchantType?: string;
  total?: number | string;
  currency?: string;
  date?: string;
  category?: string;
  paymentMethod?: string;
  location?: string;
  tax?: string | number;
  serviceCharge?: string | number;
  subtotal?: string | number;
  receiptNumber?: string;
  items?: OCRItem[];
  tips?: string | number;
  discount?: string | number;
  loyaltyNumber?: string;
  specialOffers?: string;
  tableNumber?: string | number;
  serverName?: string;
  customerCount?: string | number;
  phoneNumber?: string;
  website?: string;
  vatNumber?: string;
  timeOfDay?: string;
  orderNumber?: string;
  [key: string]: unknown; // For additional fields
};

// Subscription with payments
export type SubscriptionWithPayments = Subscription & {
  payments?: SubscriptionPayment[];
  missingPayments?: number;
  recentPayments?: SubscriptionPayment[];
};

// Paginated response
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
