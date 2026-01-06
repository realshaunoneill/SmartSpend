// Script to set a user as admin
// Run with: npx tsx scripts/set-admin.ts <email>

import 'dotenv/config';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function setAdmin(email: string) {
  if (!email) {
    console.error('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  const [user] = await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.email, email))
    .returning();

  if (user) {
    console.log(`✅ User ${email} is now an admin`);
    console.log(`   User ID: ${user.id}`);
  } else {
    console.error(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  process.exit(0);
}

const email = process.argv[2];
setAdmin(email);
