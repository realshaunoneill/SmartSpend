# Admin Panel Feature

## Overview
The admin panel provides a comprehensive dashboard for administrators to view and monitor all users, households, and receipts in the system.

## Database Changes
Added `isAdmin` boolean column to the `users` table (defaults to `false`).

## Access Control
- Admin status is determined by the `isAdmin` field in the users table
- Non-admin users attempting to access admin routes receive a 403 Forbidden response
- Admin page automatically redirects non-admin users to the dashboard
- Manual database update required to grant admin privileges (by design)

## Features

### Admin Page (`/admin`)
A comprehensive dashboard with three main tabs:

#### 1. Users Tab
Displays all registered users with:
- Email address
- Admin status badge
- Subscription status badge
- Receipt count
- Household count
- Stripe customer status
- Account creation date

#### 2. Households Tab
Shows all households with:
- Household name
- Member count
- Receipt count
- Owner email
- Creation date

#### 3. Receipts Tab
Lists all receipt submissions with:
- Merchant name
- Processing status (with color-coded badges)
- Total amount and currency
- Transaction date
- Associated user email
- Associated household (if any)
- Upload date

### Statistics Overview
The admin panel displays summary cards showing:
- Total number of users (with subscribed count)
- Total number of households (with total member count)
- Total number of receipts (with processed count)

## API Endpoints

### `GET /api/admin/check`
Verifies if the current user has admin privileges.

**Response:**
```json
{
  "isAdmin": boolean
}
```

### `GET /api/admin/users`
Retrieves all users with their associated counts.

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "subscribed": boolean,
    "isAdmin": boolean,
    "createdAt": "ISO timestamp",
    "stripeCustomerId": "string | null",
    "receiptCount": number,
    "householdCount": number
  }
]
```

### `GET /api/admin/households`
Retrieves all households with member and receipt counts.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "memberCount": number,
    "receiptCount": number,
    "ownerEmail": "string",
    "createdAt": "ISO timestamp"
  }
]
```

### `GET /api/admin/receipts`
Retrieves all receipts with user and household information (limited to 500 most recent).

**Response:**
```json
[
  {
    "id": "uuid",
    "merchantName": "string | null",
    "totalAmount": "string",
    "currency": "string",
    "transactionDate": "ISO timestamp",
    "processingStatus": "string",
    "createdAt": "ISO timestamp",
    "userEmail": "string",
    "householdName": "string | null"
  }
]
```

## Security Features

### Authorization
- All admin API endpoints check for admin status before processing requests
- Unauthorized access attempts are logged with the user ID
- Non-admin users receive 403 Forbidden responses

### Logging
All admin actions are logged with:
- Event type: `'admin'`
- Action description
- Correlation ID for request tracking
- Admin user ID for audit trail

### Rate Limiting
Consider implementing rate limiting on admin endpoints to prevent abuse (see security audit recommendations).

## Granting Admin Access

To make a user an admin, manually update the database:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

Or using Drizzle:
```typescript
await db
  .update(users)
  .set({ isAdmin: true })
  .where(eq(users.email, 'admin@example.com'));
```

## UI Components

### Layout
- Uses the standard Navigation component
- Responsive design with mobile support
- Card-based layout for organization

### Icons
- ShieldCheck: Admin panel branding
- Users: User-related information
- Home: Household information
- Receipt: Receipt information
- Mail: Email addresses
- Calendar: Dates
- CreditCard: Stripe customer status
- Loader2: Loading states

### Badge Colors
- **Default**: Subscribed users, processed receipts
- **Destructive**: Admin users, failed receipts
- **Secondary**: Processing receipts
- **Outline**: Stripe customers

## Performance Considerations

### Data Fetching
- All data is fetched in parallel on page load
- Uses Promise.all for concurrent API requests
- Client-side loading states prevent UI flashing

### Limits
- Receipt endpoint limited to 500 most recent entries to prevent performance issues
- Consider implementing pagination for larger datasets

### Database Queries
- Uses efficient joins to minimize database round trips
- Counts are calculated separately to avoid N+1 query issues

## Future Enhancements

Potential improvements:
- Pagination for large datasets
- Search and filtering capabilities
- User action buttons (suspend, delete, etc.)
- Export data to CSV
- Date range filters
- Advanced analytics and charts
- Real-time updates using websockets
- Bulk operations support
