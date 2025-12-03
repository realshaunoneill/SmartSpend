# Item Modifiers Feature

## Overview
Enhanced receipt processing to handle sub-items, modifiers, deposits, and item-specific discounts that appear indented under main line items on receipts.

## Problem Solved
Many receipts have additional charges or adjustments under main items:
- **Deposit fees**: "Deposit 15¢" under beverage items
- **Item discounts**: "-$2.00 Sale" under a specific item
- **Add-ons**: "Extra Cheese $1.50" under a sandwich
- **Modifiers**: "No Onions", "Extra Sauce", etc.
- **Fees**: "Packaging Fee $0.50" under takeout items

Previously, these were either:
- Ignored completely
- Incorrectly treated as separate items
- Merged into the main item price without transparency

## Implementation

### 1. Enhanced OpenAI Prompt
**File**: `lib/openai.ts`

Updated the GPT-4o prompt to recognize and extract modifiers:

```typescript
items: array of objects with:
  * name: item name
  * quantity: quantity (number)
  * price: TOTAL price including all modifiers (number)
  * category: item category (optional)
  * description: brief description (optional)
  * modifiers: array of sub-items/modifiers (optional), each with:
    - name: modifier name (e.g., "Deposit", "Extra Cheese")
    - price: modifier price (can be negative for discounts)
    - type: "fee" | "deposit" | "discount" | "addon" | "modifier"
```

**Key Instructions**:
- Handle indented sub-items correctly
- Main item price should be final price INCLUDING modifiers
- List modifiers separately for transparency
- Detect deposit fees, discounts, add-ons, and modifiers

### 2. TypeScript Interface
**File**: `lib/openai.ts`

```typescript
export interface ItemModifier {
  name: string;
  price: number;
  type: "fee" | "deposit" | "discount" | "addon" | "modifier";
}

export interface ReceiptData {
  // ... other fields
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
    category?: string;
    description?: string;
    modifiers?: ItemModifier[];  // NEW
  }>;
}
```

### 3. Database Schema
**File**: `lib/db/schema.ts`

Added `modifiers` column to `receipt_items` table:

```typescript
modifiers: jsonb('modifiers')
// Stores: [{ name: string, price: number, type: string }]
```

**Migration**: `lib/db/migrations/add_item_modifiers.sql`
- Adds JSONB column for modifiers
- Creates GIN index for efficient queries
- Adds column comment for documentation

### 4. API Updates

#### Process Route
**File**: `app/api/receipt/process/route.ts`

Now saves modifiers when inserting receipt items:

```typescript
modifiers: item.modifiers || null
```

#### Retry Route
**File**: `app/api/receipts/[id]/retry/route.ts`

Also saves modifiers when retrying failed receipts.

### 5. UI Display
**File**: `components/receipts/receipt-detail-modal.tsx`

Enhanced item display to show modifiers:

**Features**:
- Modifiers shown indented under main item
- Left border to indicate hierarchy
- Color-coded by type:
  - 🟢 **Green**: Discounts (negative prices)
  - 🔵 **Blue**: Deposits
  - 🟠 **Orange**: Fees
  - ⚪ **Gray**: Add-ons/Modifiers
- Type badge for each modifier
- Price shown with +/- prefix
- Icons for visual identification

## Examples

### Example 1: Beverage with Deposit
```
Coca-Cola 2L                    $2.99
  └─ Deposit                    +$0.15  [deposit]
```

### Example 2: Item with Discount
```
Organic Bananas                 $3.99
  └─ Member Discount           -$0.50  [discount]
```

### Example 3: Restaurant Item with Add-ons
```
Cheeseburger                    $12.99
  ├─ Extra Cheese               +$1.50  [addon]
  ├─ Bacon                      +$2.00  [addon]
  └─ No Onions                   $0.00  [modifier]
```

### Example 4: Takeout with Fees
```
Pad Thai                        $14.99
  ├─ Packaging Fee              +$0.50  [fee]
  └─ Extra Spicy                 $0.00  [modifier]
```

## Modifier Types

### 1. **deposit**
- Bottle/can deposits
- Container deposits
- Refundable charges
- **Color**: Blue
- **Icon**: Tag

### 2. **discount**
- Item-specific discounts
- Sale prices
- Member discounts
- Coupon applications
- **Color**: Green
- **Icon**: Percent
- **Price**: Negative

### 3. **fee**
- Packaging fees
- Service fees
- Handling charges
- **Color**: Orange
- **Icon**: Info

### 4. **addon**
- Extra ingredients
- Upgrades
- Add-ons
- **Color**: Default
- **Icon**: None

### 5. **modifier**
- Preparation instructions
- Customizations
- Usually $0.00
- **Color**: Default
- **Icon**: None

## Benefits

### For Users
✅ **Transparency**: See exactly what you paid for
✅ **Accuracy**: Deposits and fees properly tracked
✅ **Understanding**: Know why items cost what they do
✅ **Tracking**: Monitor deposit fees over time
✅ **Budgeting**: Better understand true item costs

### For Analytics
✅ **Deposit Tracking**: Calculate total deposits paid
✅ **Discount Analysis**: See savings from discounts
✅ **Fee Monitoring**: Track packaging/service fees
✅ **Add-on Patterns**: Understand customization habits
✅ **True Costs**: Separate base price from modifiers

### For Developers
✅ **Structured Data**: Clean, typed modifier information
✅ **Extensible**: Easy to add new modifier types
✅ **Queryable**: JSONB with GIN index for fast queries
✅ **Backward Compatible**: Existing items work without modifiers

## Data Structure

### Database Storage (JSONB)
```json
{
  "modifiers": [
    {
      "name": "Deposit",
      "price": 0.15,
      "type": "deposit"
    },
    {
      "name": "Member Discount",
      "price": -0.50,
      "type": "discount"
    }
  ]
}
```

### API Response
```json
{
  "items": [
    {
      "name": "Coca-Cola 2L",
      "quantity": 1,
      "price": 3.14,
      "category": "beverages",
      "modifiers": [
        {
          "name": "Deposit",
          "price": 0.15,
          "type": "deposit"
        }
      ]
    }
  ]
}
```

## UI Components

### Item Display
```tsx
<div className="item">
  <div className="main-item">
    Coca-Cola 2L - $3.14
  </div>
  
  {/* Modifiers - indented with border */}
  <div className="modifiers">
    <div className="modifier deposit">
      <Tag icon /> Deposit [deposit] +$0.15
    </div>
  </div>
</div>
```

### Visual Hierarchy
- Main item: Bold, larger text
- Modifiers: Indented, smaller text, left border
- Type badges: Small, color-coded
- Icons: Type-specific visual indicators

## Query Examples

### Find items with deposits
```sql
SELECT * FROM receipt_items 
WHERE modifiers @> '[{"type": "deposit"}]'::jsonb;
```

### Calculate total deposits
```sql
SELECT 
  SUM((modifier->>'price')::numeric) as total_deposits
FROM receipt_items,
  jsonb_array_elements(modifiers) as modifier
WHERE modifier->>'type' = 'deposit';
```

### Find items with discounts
```sql
SELECT * FROM receipt_items 
WHERE modifiers @> '[{"type": "discount"}]'::jsonb;
```

## Testing Checklist

- [ ] Upload receipt with deposit fees
- [ ] Upload receipt with item discounts
- [ ] Upload receipt with add-ons
- [ ] Upload receipt with modifiers
- [ ] Verify modifiers display correctly
- [ ] Check color coding by type
- [ ] Verify price calculations
- [ ] Test retry with modifiers
- [ ] Check database storage
- [ ] Verify GIN index works

## Migration Steps

1. **Run Database Migration**:
   ```bash
   psql $DATABASE_URL < lib/db/migrations/add_item_modifiers.sql
   ```

2. **Deploy Code Changes**:
   - Deploy updated OpenAI prompt
   - Deploy schema changes
   - Deploy UI updates

3. **Test**:
   - Upload receipts with various modifier types
   - Verify display in modal
   - Check database storage

## Future Enhancements

### Potential Improvements
1. **Modifier Analytics**: Track deposit fees over time
2. **Discount Tracking**: Calculate total savings
3. **Fee Monitoring**: Alert on high packaging fees
4. **Smart Grouping**: Group similar modifiers
5. **Modifier Search**: Find items by modifier type
6. **Export**: Include modifiers in CSV exports
7. **Bulk Edit**: Edit modifiers for multiple items
8. **Templates**: Common modifier templates

### Advanced Features
- **Deposit Refund Tracking**: Track when deposits are refunded
- **Discount Optimization**: Suggest better discount opportunities
- **Fee Comparison**: Compare fees across merchants
- **Modifier Trends**: Analyze modifier patterns over time

## Support

For issues or questions:
- Check modifier display in receipt modal
- Verify database has modifiers column
- Review OpenAI extraction logs
- Check modifier type values
