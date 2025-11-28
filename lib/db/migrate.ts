import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Run database migrations
 * This script applies all pending migrations to the database
 */
async function runMigrations() {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('Please configure your database connection before running migrations');
    process.exit(1);
  }

  console.log('Starting database migration...');

  // Create a connection for migrations
  const migrationClient = postgres(process.env.DATABASE_URL, {
    max: 1,
  });

  const db = drizzle(migrationClient);

  try {
    // Run migrations from the migrations folder
    await migrate(db, {
      migrationsFolder: './lib/db/migrations',
    });

    console.log('✓ Database migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
