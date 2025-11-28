# Clerk Authentication Setup

This application uses Clerk for authentication. Follow these steps to configure Clerk:

## 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application in the Clerk dashboard

## 2. Get Your API Keys

1. In the Clerk dashboard, navigate to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

## 3. Configure Environment Variables

Create a `.env.local` file in the root of your project and add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 4. Configure Clerk Webhook

To sync users to your database, you need to set up a webhook:

1. In the Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/auth/webhook`
4. Select the `user.created` event
5. Copy the **Signing Secret** and add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

## 5. Configure Redirect URLs

In the Clerk dashboard:

1. Go to **Paths**
2. Set the following paths:
   - Sign-in path: `/sign-in`
   - Sign-up path: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

## Testing Locally

For local development with webhooks, you can use a tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Start your Next.js dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL for your webhook endpoint
# Example: https://abc123.ngrok.io/api/auth/webhook
```

## Features Implemented

- ✅ User sign-up with Clerk
- ✅ User sign-in with Clerk
- ✅ Protected routes via middleware
- ✅ Automatic user sync to database via webhook
- ✅ Session management
- ✅ Sign-out functionality

## Routes

- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/dashboard` - Protected dashboard (requires authentication)
- All other routes except `/` require authentication
