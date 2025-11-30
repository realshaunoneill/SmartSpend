# Enhanced Receipt Processing 🚀

This document outlines the comprehensive enhancements made to the receipt processing system to extract detailed information from receipt images.

## 🎯 Overview

The enhanced receipt processing system now extracts **25+ data points** from each receipt, providing rich, structured data for better expense tracking and analytics.

## 📊 Enhanced Data Extraction

### Core Receipt Information
- **Merchant Name**: Store or restaurant name
- **Total Amount**: Final transaction amount
- **Currency**: Currency code (USD, GBP, EUR, etc.)
- **Category**: Auto-categorized spending type
- **Transaction Date**: Date of purchase (YYYY-MM-DD format)

### Business Details
- **Merchant Type**: Type of business (restaurant, grocery_store, etc.)
- **Location**: Full store address
- **Phone Number**: Merchant contact number
- **Website**: Merchant website URL
- **VAT Number**: Tax registration number

### Transaction Details
- **Payment Method**: How payment was made (Card, Cash, Apple Pay, etc.)
- **Receipt Number**: Transaction reference number
- **Order Number**: Order reference (if different from receipt)
- **Time of Day**: Transaction time (HH:MM format)

### Financial Breakdown
- **Subtotal**: Amount before tax and fees
- **Tax**: Tax amount charged
- **Service Charge**: Service fees
- **Tips**: Tip amount (if visible)
- **Discount**: Discount amount applied
- **Delivery Fee**: Delivery charges
- **Packaging Fee**: Packaging charges

### Service Details (Restaurants)
- **Table Number**: Restaurant table number
- **Server Name**: Cashier or server name
- **Customer Count**: Number of customers/covers

### Loyalty & Promotions
- **Loyalty Number**: Loyalty card or member number
- **Special Offers**: Promotions or deals mentioned

### Enhanced Item Details
Each item now includes:
- **Name**: Item name
- **Quantity**: Number of items
- **Unit Price**: Price per individual item
- **Total Price**: Total for this line item
- **Category**: Item-specific category
- **Description**: Additional item details

## 🏷️ Smart Categorization

The system automatically categorizes receipts into these categories:

| Category | Examples |
|----------|----------|
| `groceries` | Supermarkets, food stores, grocery chains |
| `dining` | Restaurants, cafes, bars, pubs |
| `coffee` | Coffee shops, cafes focused on beverages |
| `gas` | Gas stations, fuel, automotive |
| `transportation` | Parking, transit, taxi, uber |
| `shopping` | Retail stores, clothing, electronics |
| `pharmacy` | Pharmacies, drugstores, medical supplies |
| `healthcare` | Hospitals, clinics, medical services |
| `entertainment` | Movies, games, events, recreation |
| `utilities` | Bills, services, subscriptions |
| `travel` | Hotels, flights, travel services |
| `home` | Home improvement, furniture, household |
| `other` | Everything else |

## 🏪 Merchant Types

Recognized business types:
- `restaurant` - Full-service restaurants
- `grocery_store` - Supermarkets and grocery stores
- `gas_station` - Fuel stations
- `pharmacy` - Pharmacies and drugstores
- `retail` - General retail stores
- `coffee_shop` - Coffee shops and cafes
- `fast_food` - Quick service restaurants
- `department_store` - Large retail stores
- `convenience_store` - Small convenience stores
- `supermarket` - Large grocery chains
- `other` - Other business types

## 💳 Payment Methods

Supported payment method detection:
- `Card` - Generic card payment
- `Cash` - Cash payment
- `Contactless` - Contactless card payment
- `Chip & PIN` - Chip and PIN card payment
- `Apple Pay` - Apple Pay mobile payment
- `Google Pay` - Google Pay mobile payment
- `Debit` - Debit card payment
- `Credit` - Credit card payment

## 🗄️ Database Schema

### Enhanced Receipt Fields
```sql
receipts (
  -- Existing fields
  id, userId, householdId, imageUrl, merchantName, 
  totalAmount, currency, transactionDate, category,
  paymentMethod, location, tax, serviceCharge, 
  subtotal, receiptNumber, ocrData, createdAt, updatedAt
)
```

### Enhanced Receipt Items Fields
```sql
receipt_items (
  -- Existing fields
  id, receiptId, name, quantity, price, createdAt,
  -- New enhanced fields
  unitPrice,     -- Price per individual item
  totalPrice,    -- Total price for line item
  category,      -- Item category
  description    -- Item description
)
```

## 🔧 API Response Structure

The enhanced API now returns comprehensive data:

```json
{
  "success": true,
  "receipt": {
    "id": "receipt-uuid",
    "merchantName": "Restaurant Name",
    "totalAmount": "45.67",
    "currency": "USD",
    "category": "dining",
    "items": [...],
    "itemCount": 3
  },
  "extractedData": {
    "merchant": "Restaurant Name",
    "total": 45.67,
    "currency": "USD",
    "category": "dining",
    "merchantType": "restaurant",
    "paymentMethod": "Card",
    "tips": 5.00,
    "tableNumber": "12",
    "serverName": "John Doe",
    "items": [
      {
        "name": "Grilled Salmon",
        "quantity": 1,
        "price": 24.99,
        "category": "main_course",
        "description": "Atlantic salmon with lemon"
      }
    ]
  }
}
```

## 🚀 Performance Improvements

- **Smarter Prompts**: More specific OpenAI instructions for better extraction
- **Enhanced Logging**: Detailed extraction metrics for debugging
- **Structured Data**: Consistent JSON format for all extracted data
- **Error Handling**: Robust error handling for missing or invalid data

## 📈 Analytics Benefits

The enhanced data enables:
- **Detailed Spending Analysis**: Category-based spending insights
- **Merchant Intelligence**: Business type and location tracking
- **Payment Method Analytics**: Payment preference tracking
- **Item-Level Insights**: Detailed purchase behavior analysis
- **Service Quality Tracking**: Server and service details
- **Loyalty Program Integration**: Automatic loyalty number capture

## 🔄 Migration

To update your database with the new fields:

```bash
# Run the migration script
psql -d your_database -f scripts/migrate-receipt-fields.sql
```

## 🧪 Testing

Use the test script to verify functionality:

```bash
# Run the enhanced receipt test
npx tsx scripts/test-enhanced-receipt.ts
```

## 🎯 Impact

The enhanced receipt processing provides:
- **25+ extracted fields** per receipt
- **Automatic categorization** with 13 categories
- **Smart merchant type detection** with 10+ types
- **Comprehensive financial breakdown** with 7 fee types
- **Enhanced item details** with categories and descriptions
- **Service quality tracking** for restaurants
- **Loyalty program integration** capabilities

This creates a foundation for advanced expense analytics, budgeting insights, and spending pattern analysis.