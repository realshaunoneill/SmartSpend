import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function addDeletedAtColumn() {
  try {
    console.log("Adding deleted_at column to receipts table...");
    
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'receipts' 
      AND column_name = 'deleted_at'
    `);
    
    if (result && result.length > 0) {
      console.log("Column deleted_at already exists!");
      return;
    }
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE receipts ADD COLUMN deleted_at timestamp
    `);
    
    console.log("✓ Successfully added deleted_at column");
  } catch (error) {
    console.error("Error adding column:", error);
    throw error;
  }
}

addDeletedAtColumn()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
