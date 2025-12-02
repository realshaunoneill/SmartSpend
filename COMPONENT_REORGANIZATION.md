# Component Reorganization

## Overview

Reorganized the `components/` folder into logical subfolders based on feature areas for better maintainability and discoverability.

## New Structure

```
components/
├── ui/                    # shadcn/ui components (unchanged)
├── layout/                # Layout and navigation components
├── receipts/              # Receipt-related components
├── households/            # Household and sharing components
├── insights/              # Analytics and insights components
├── subscriptions/         # Subscription-related components
└── bank/                  # Bank integration components
```

## Component Mapping

### Layout Components (`components/layout/`)
- `navigation.tsx` - Main navigation bar
- `pagination.tsx` - Pagination component
- `theme-provider.tsx` - Theme context provider
- `theme-toggle.tsx` - Dark/light mode toggle

### Receipt Components (`components/receipts/`)
- `receipt-assignment-dialog.tsx` - Assign receipts to households
- `receipt-detail-modal.tsx` - View receipt details
- `receipt-list-skeleton.tsx` - Loading skeleton
- `receipt-list.tsx` - List of receipts
- `receipt-upload.tsx` - Upload receipt component

### Household Components (`components/households/`)
- `create-household-dialog.tsx` - Create new household
- `household-card.tsx` - Household card display
- `household-list.tsx` - List of households
- `household-members-list.tsx` - List household members
- `household-receipts.tsx` - Household receipts view
- `household-selector.tsx` - Dropdown to select household
- `invitation-notifications.tsx` - Invitation notifications
- `invite-member-dialog.tsx` - Invite members dialog

### Insights Components (`components/insights/`)
- `item-analysis-dialog.tsx` - Analyze specific item spending
- `item-search-analysis.tsx` - Search and analyze items
- `quick-stats.tsx` - Quick statistics cards
- `spending-chart.tsx` - Spending visualization chart
- `spending-summary-card.tsx` - AI spending summary
- `spending-summary.tsx` - Spending summary component
- `top-items-list.tsx` - Top purchased items list

### Subscription Components (`components/subscriptions/`)
- `subscription-banner.tsx` - Subscription upgrade banner
- `subscription-gate.tsx` - Feature gating component

### Bank Components (`components/bank/`)
- `bank-connection-card.tsx` - Bank connection card
- `bank-transactions-list.tsx` - List of bank transactions

## Import Updates

All imports have been automatically updated throughout the codebase:

**Before:**
```typescript
import { Navigation } from "@/components/navigation"
import { ReceiptList } from "@/components/receipt-list"
import { HouseholdCard } from "@/components/household-card"
```

**After:**
```typescript
import { Navigation } from "@/components/layout/navigation"
import { ReceiptList } from "@/components/receipts/receipt-list"
import { HouseholdCard } from "@/components/households/household-card"
```

## Benefits

### 1. Better Organization
- Components grouped by feature area
- Easy to find related components
- Clear separation of concerns

### 2. Improved Discoverability
- New developers can quickly locate components
- Feature-based organization matches mental model
- Reduced cognitive load when navigating codebase

### 3. Scalability
- Easy to add new components to appropriate folders
- Clear patterns for where new components belong
- Prevents root-level component folder bloat

### 4. Maintainability
- Related components are co-located
- Easier to refactor feature areas
- Simpler to understand component dependencies

## Usage Guidelines

### Adding New Components

**Layout Components:**
- Navigation, headers, footers
- Theme-related components
- Pagination, breadcrumbs

**Receipt Components:**
- Receipt display, editing, viewing
- Receipt upload and processing
- Receipt-specific dialogs

**Household Components:**
- Household management
- Member invitations
- Household-specific features

**Insights Components:**
- Analytics and reporting
- Charts and visualizations
- Spending analysis

**Subscription Components:**
- Subscription management
- Feature gating
- Upgrade prompts

**Bank Components:**
- Bank integrations
- Transaction displays
- Bank connection management

### Import Patterns

Always use the full path from the feature folder:

```typescript
// ✅ Good
import { ReceiptList } from "@/components/receipts/receipt-list"
import { Navigation } from "@/components/layout/navigation"

// ❌ Bad (old pattern)
import { ReceiptList } from "@/components/receipt-list"
import { Navigation } from "@/components/navigation"
```

## Migration Script

The `update-component-imports.sh` script was used to automatically update all imports across the codebase. This script can be referenced if additional bulk updates are needed in the future.

## Verification

All TypeScript diagnostics pass after reorganization:
- ✅ No broken imports
- ✅ All components accessible
- ✅ Type checking passes
- ✅ Build succeeds

## Future Considerations

### Potential Additions

1. **`components/dashboard/`** - Dashboard-specific components
2. **`components/settings/`** - Settings page components
3. **`components/auth/`** - Authentication components (if needed)
4. **`components/shared/`** - Truly shared components across features

### Index Files

Consider adding `index.ts` files to each folder for cleaner imports:

```typescript
// components/receipts/index.ts
export { ReceiptList } from './receipt-list'
export { ReceiptUpload } from './receipt-upload'
export { ReceiptDetailModal } from './receipt-detail-modal'

// Usage
import { ReceiptList, ReceiptUpload } from '@/components/receipts'
```

### Component Documentation

Each folder could include a `README.md` documenting:
- Purpose of components in the folder
- Common usage patterns
- Dependencies and relationships

## Conclusion

The component reorganization provides a solid foundation for scaling the application. The feature-based organization makes it easy for developers to find and maintain components, while the automated import updates ensure no breaking changes.
