# Stripe Checkout Implementation 💳

## Overview
Implemented a complete Stripe checkout flow with proper customer management for subscription handling. The system creates and associates Stripe customers with users, stores customer IDs in the database, and includes comprehensive metadata (userId, clerkId, email) for robust tracking and webhook processing.

## ✅ What Was Created

### **1. Stripe Helper Functions** (`lib/stripe.ts`)

#### **`getOrCreateStripeCustomer()`**
Creates or retrieves a Stripe customer for a user:
- Checks if user already has a Stripe customer ID
- Verifies existing customer still exists in Stripe
- Creates new Stripe customer if needed with metadata:
  - `userId` - Database user ID
  - `clerkId` - Clerk authentication ID
  - `email` - User email address
- Updates user record in database with customer ID
- Returns customer ID for checkout session

#### **`createCheckoutSession()`**
Creates a Stripe checkout session for subscriptions:
- Associates session with Stripe customer
- Accepts custom success/cancel URLs
- Links session to user via `client_reference_id`
- Stores comprehensive metadata:
  - `userId` - Database user ID
  - `clerkId` - Clerk authentication ID
  - `email` - User email address

### **2. Checkout API Endpoint** (`app/api/checkout/route.ts`)
- **Route**: `POST /api/checkout`
- **Authentication**: Required (Clerk)
- **Features**:
  - Validates user authentication
  - Gets or creates user in database
  - Verifies Stripe price is active
  - **Gets or creates Stripe customer** (new!)
  - **Updates database with customer ID** (new!)
  - Creates checkout session with customer association
  - Returns checkout URL for redirect

### **3. Updated Components**
- **SubscriptionBanner**: Now redirects to Stripe checkout
- **SubscriptionGate**: Now redirects to Stripe checkout
- Both components handle errors gracefully

## 🔧 Configuration Required

### **1. Set Your Stripe Price ID**
In `.env.local`, update:
```env
STRIPE_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID
```

**How to get your Price ID:**
1. Go to https://dashboard.stripe.com/test/products
2. Create a new product (or use existing)
3. Add a recurring price (monthly/yearly)
4. Copy the Price ID (starts with `price_`)

### **2. Environment Variables**
Already configured:
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL`

Need to add:
- ⚠️ `STRIPE_PRICE_ID` - Your subscription price ID

## 📋 API Usage

### **Request**
```typescript
POST /api/checkout
Content-Type: application/json

{
  "priceId": "price_xxx", // Optional - uses env var if not provided
  "successUrl": "https://yourapp.com/success", // Optional
  "cancelUrl": "https://yourapp.com/cancel" // Optional
}
```

### **Response**
```typescript
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### **Error Responses**
- `401`: Unauthorized (not logged in)
- `400`: Missing/invalid price ID or user email
- `500`: Server error creating session

## 🔄 User Flow

### **From Subscription Banner**
1. User clicks "Upgrade Now" button
2. Frontend calls `POST /api/checkout`
3. API creates Stripe checkout session
4. User redirected to Stripe checkout page
5. User completes payment
6. Stripe redirects to success URL
7. Webhook updates user subscription status

### **From Subscription Gate**
1. User tries to access premium feature
2. Sees subscription gate with benefits
3. Clicks "Upgrade to Premium"
4. Same flow as above

## 🎯 Success/Cancel URLs

### **Default URLs**
- **Success**: `/settings?success=true`
- **Cancel**: `/settings?canceled=true`

### **Custom URLs**
Pass in request body:
```typescript
{
  "successUrl": "https://yourapp.com/custom-success",
  "cancelUrl": "https://yourapp.com/custom-cancel"
}
```

## 🔐 Security Features

### **Authentication**
- Clerk authentication required
- User must have valid email
- User automatically created in database if needed

### **Price Validation**
- Verifies price exists in Stripe
- Checks price is active
- Prevents invalid subscriptions

### **User Tracking**
- Creates persistent Stripe customer for each user
- Links checkout to customer and user via `client_reference_id`
- Stores comprehensive metadata in both customer and session:
  - `userId` - Database user ID for lookups
  - `clerkId` - Clerk authentication ID
  - `email` - User email address
- Updates database with Stripe customer ID
- Enables robust webhook processing with multiple lookup methods

## 📊 Checkout Session Details

### **Customer Creation**
```typescript
// Creates Stripe customer with comprehensive metadata
const customer = await stripe.customers.create({
  email: email,
  metadata: {
    userId: userId,     // Database user ID
    clerkId: clerkId,   // Clerk authentication ID
    email: email,       // User email for reference
  },
});

// Updates database with customer ID
await db.update(users)
  .set({ 
    stripeCustomerId: customer.id,
    updatedAt: new Date() 
  })
  .where(eq(users.id, userId));
```

### **Checkout Session Configuration**
```typescript
{
  mode: "subscription",
  customer: stripeCustomerId,  // Associates with customer
  payment_method_types: ["card"],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: "...",
  cancel_url: "...",
  client_reference_id: userId,
  metadata: { 
    userId: userId,
    clerkId: clerkId,
    email: email
  }
}
```

### **Features**
- Single subscription per user
- Card payments only (can be extended)
- Automatic quantity of 1
- User ID tracked for webhooks

## 🔔 Next Steps

### **1. Create Stripe Product**
```bash
# In Stripe Dashboard:
1. Go to Products
2. Click "Add product"
3. Name: "Premium Subscription"
4. Pricing: Recurring (monthly or yearly)
5. Copy the Price ID
```

### **2. Update Environment Variable**
```bash
# In .env.local
STRIPE_PRICE_ID=price_1234567890abcdef
```

### **3. Set Up Webhook Handler**
You'll need to create a webhook endpoint to handle:
- `checkout.session.completed` - Update user subscription
- `customer.subscription.updated` - Handle subscription changes
- `customer.subscription.deleted` - Handle cancellations

**Webhook Processing Made Easy:**
With customer IDs stored in the database, you can now look up users by:
```typescript
// Option 1: By customer ID (recommended)
const user = await UserService.getUserByStripeCustomerId(customerId);

// Option 2: By metadata
const userId = event.data.object.metadata.userId;
const user = await UserService.getUserProfile(userId);

// Option 3: By Clerk ID
const clerkId = event.data.object.metadata.clerkId;
const user = await UserService.getUserByClerkId(clerkId);
```

### **4. Test the Flow**
```bash
# Use Stripe test cards:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

## 🧪 Testing

### **Test Checkout Creation**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: your-clerk-session-cookie" \
  -d '{}'
```

### **Test with Custom Price**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: your-clerk-session-cookie" \
  -d '{"priceId": "price_test_123"}'
```

## 📝 Code Examples

### **Frontend Usage**
```typescript
// In any component
const handleUpgrade = async () => {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const { url } = await response.json();
    window.location.href = url; // Redirect to Stripe
  } catch (error) {
    console.error("Checkout failed:", error);
  }
};
```

### **With Custom URLs**
```typescript
const response = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    successUrl: `${window.location.origin}/welcome`,
    cancelUrl: `${window.location.origin}/pricing`,
  }),
});
```

## 🎨 UI Integration

### **Components Updated**
1. **SubscriptionBanner** - Shows on all pages for non-subscribers
2. **SubscriptionGate** - Blocks premium features

### **User Experience**
- Click "Upgrade Now" → Redirect to Stripe
- Complete payment → Return to app
- Subscription activated → Access premium features

## 🔍 Troubleshooting

### **"Price ID not configured"**
- Add `STRIPE_PRICE_ID` to `.env.local`
- Restart your dev server

### **"Invalid price ID"**
- Verify price exists in Stripe dashboard
- Check you're using test/live keys correctly
- Ensure price is active

### **"User email not found"**
- User must have email in Clerk
- Check Clerk user profile

### **Checkout URL not working**
- Verify `NEXT_PUBLIC_APP_URL` is set
- Check success/cancel URLs are valid
- Ensure Stripe keys are correct

## 📈 Future Enhancements

### **Multiple Plans**
- Add plan selection UI
- Pass different price IDs
- Show plan comparison

### **Promo Codes**
```typescript
{
  allow_promotion_codes: true,
}
```

### **Trial Periods**
```typescript
{
  subscription_data: {
    trial_period_days: 14,
  },
}
```

### **Customer Portal**
- Allow users to manage subscriptions
- Update payment methods
- View invoices

The checkout flow is now fully functional and ready for testing with Stripe test mode!