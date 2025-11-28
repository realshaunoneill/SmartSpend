"use server"

// Mock OCR scanning with OpenAI Vision (replace with real API when ready)
export async function scanReceiptImage(imageUrl: string) {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock OCR result
  return {
    merchant_name: "Whole Foods Market",
    total_amount: 87.43,
    currency: "USD",
    transaction_date: new Date().toISOString(),
    category: "groceries",
    payment_method: "credit_card",
    items: [
      {
        item_name: "Organic Bananas",
        quantity: 2,
        unit_price: 3.99,
        total_price: 7.98,
      },
      {
        item_name: "Almond Milk",
        quantity: 1,
        unit_price: 4.99,
        total_price: 4.99,
      },
      {
        item_name: "Mixed Greens",
        quantity: 1,
        unit_price: 5.49,
        total_price: 5.49,
      },
    ],
    raw_data: {
      confidence: 0.95,
      processor: "openai-vision",
    },
  }
}

export async function saveReceipt(data: {
  imageUrl: string
  ocrData: any
  userId: string
  householdId?: string
}) {
  // Mock save to database
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    id: `receipt-${Date.now()}`,
    ...data,
    created_at: new Date().toISOString(),
  }
}
