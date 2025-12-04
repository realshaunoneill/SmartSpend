import { pgTable, uuid, text, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  subscribed: boolean('subscribed').notNull().default(false),
  stripeCustomerId: text('stripe_customer_id').unique(),
  defaultHouseholdId: uuid('default_household_id').references(() => households.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Households Table
export const households = pgTable('households', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Household Users Table
export const householdUsers = pgTable('household_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner' | 'member'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueHouseholdUser: unique().on(table.householdId, table.userId),
}));

// Bank Connections Table
export const bankConnections = pgTable('bank_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bankName: text('bank_name').notNull(),
  status: text('status').notNull(), // 'active' | 'inactive' | 'error'
  credentials: jsonb('credentials').notNull(), // Encrypted credentials
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Receipts Table
export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  merchantName: text('merchant_name'),
  totalAmount: text('total_amount'),
  currency: text('currency'),
  transactionDate: text('transaction_date'),
  category: text('category'),
  paymentMethod: text('payment_method'),
  location: text('location'),
  tax: text('tax'),
  serviceCharge: text('service_charge'),
  subtotal: text('subtotal'),
  receiptNumber: text('receipt_number'),
  ocrData: jsonb('ocr_data'), // Full OCR response
  processingTokens: jsonb('processing_tokens'), // OpenAI token usage: { prompt_tokens, completion_tokens, total_tokens }
  processingStatus: text('processing_status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  processingError: text('processing_error'), // Error message if processing failed
  deletedAt: timestamp('deleted_at'), // Soft delete timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Receipt Items Table
export const receiptItems = pgTable('receipt_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  receiptId: uuid('receipt_id').notNull().references(() => receipts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: text('quantity'),
  unitPrice: text('unit_price'),
  totalPrice: text('total_price'),
  price: text('price'), // Keep for backward compatibility
  category: text('category'),
  description: text('description'),
  modifiers: jsonb('modifiers'), // Array of { name, price, type }
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Household Invitations Table
export const householdInvitations = pgTable('household_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  invitedByUserId: uuid('invited_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitedEmail: text('invited_email').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined' | 'expired'
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// TypeScript Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;

export type HouseholdUser = typeof householdUsers.$inferSelect;
export type NewHouseholdUser = typeof householdUsers.$inferInsert;

export type BankConnection = typeof bankConnections.$inferSelect;
export type NewBankConnection = typeof bankConnections.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;

export type HouseholdInvitation = typeof householdInvitations.$inferSelect;
export type NewHouseholdInvitation = typeof householdInvitations.$inferInsert;

// Additional types for business logic
export type HouseholdMember = {
  userId: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: Date;
};
