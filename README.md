# ReceiptWise

> **AI-Powered Receipt Management & Expense Tracking**

ReceiptWise is a modern expense tracking application that uses AI to automatically scan receipts, track spending patterns, and provide intelligent financial insights. Built with Next.js 14, TypeScript, and OpenAI.

![ReceiptWise](public/og-image.png)

## ✨ Features

### 🤖 AI-Powered Features

- **AI Receipt Scanning** - Upload receipts and our GPT-4o powered AI extracts merchant, amount, date, and line items automatically with 99% accuracy
- **Smart Budget Recommendations** - AI analyzes your spending patterns and creates personalized budget recommendations with actionable savings tips
- **Spending Anomaly Detection** - Get notified about unusual spending, price changes, and potential duplicate charges automatically
- **AI Spending Forecast** - AI predicts your next month's spending based on your patterns, helping you plan ahead and avoid surprises
- **AI-Generated Summaries** - Get intelligent monthly and weekly spending summaries with insights

### 📊 Analytics & Insights

- **Spending Analytics** - Deep insights into your spending patterns and trends
- **Price Tracking** - Track prices of items you buy frequently, see trends, and find the best deals
- **Category Analysis** - See where your money goes with automatic categorization
- **Top Items Analysis** - Discover which items you purchase most frequently

### 👥 Household & Sharing

- **Household Sharing** - Create households for family, roommates, or partners
- **Shared Expenses** - Everyone can upload receipts and track shared expenses together
- **Subscription Management** - Track recurring subscriptions and upcoming payments across your household

### 🔧 Additional Features

- **Receipt Storage** - Never lose a receipt again. All receipts stored securely in the cloud
- **Powerful Search** - Search all receipts by merchant, category, or specific items
- **Chrome Extension** - Capture receipts from any webpage with one-click snipping
- **Data Export** - Export your data as CSV or JSON for taxes or backup
- **Multi-Currency Support** - Track expenses in multiple currencies

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI**: [OpenAI GPT-4o](https://openai.com/) with [Vercel AI SDK](https://sdk.vercel.ai/)
- **Payments**: [Stripe](https://stripe.com/)
- **Analytics**: [PostHog](https://posthog.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Clerk account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/realshaunoneill/SmartSpend.git
   cd SmartSpend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in the required environment variables:
   ```env
   # Database
   DATABASE_URL=postgresql://...

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Stripe
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (protected)/        # Authenticated routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── insights/       # AI insights & analytics
│   │   ├── receipts/       # Receipt management
│   │   ├── subscriptions/  # Subscription tracking
│   │   └── settings/       # User settings
│   ├── api/                # API routes
│   └── sign-in/            # Authentication pages
├── components/             # React components
│   ├── insights/           # AI insights components
│   ├── households/         # Household management
│   ├── receipts/           # Receipt components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities & configurations
│   ├── db/                 # Database schema & config
│   ├── hooks/              # Custom React hooks
│   └── openai.ts           # AI functions
├── chrome-extension/       # Browser extension
└── public/                 # Static assets
```

## 🔌 API Endpoints

### Receipts
- `POST /api/receipt/process` - Upload and process a receipt with AI
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/[id]` - Get a specific receipt

### AI Insights
- `GET /api/receipts/budget-recommendations` - AI budget recommendations
- `GET /api/receipts/anomalies` - AI spending anomaly detection
- `GET /api/receipts/forecast` - AI spending forecast
- `GET /api/receipts/price-trends` - Price tracking for items
- `GET /api/receipts/items/summary` - AI spending summary
- `GET /api/receipts/items/top` - Top purchased items

### Households
- `GET /api/households` - Get user's households
- `POST /api/households` - Create a new household
- `POST /api/households/[id]/invitations` - Invite members

### Subscriptions
- `GET /api/subscriptions` - Get tracked subscriptions
- `POST /api/subscriptions` - Create a subscription

## 🧩 Chrome Extension

The Chrome extension allows you to capture receipts from any webpage:

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

See [chrome-extension/README.md](chrome-extension/README.md) for more details.

## 🧪 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support, email support@receiptwise.app or visit our [support page](https://receiptwise.app/support).

---

Built with ❤️ by [Shaun O'Neill](https://github.com/realshaunoneill)
