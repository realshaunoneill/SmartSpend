import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { submitLogEvent } from '@/lib/logging';

// Singleton pattern for database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection
 * Uses singleton pattern to ensure only one connection pool exists
 */
function getDb() {
  if (!dbInstance) {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure your database connection.'
      );
    }

    try {
      // Create postgres connection with connection pooling
      const client = postgres(process.env.DATABASE_URL, {
        max: 10, // Maximum number of connections in the pool
        idle_timeout: 20, // Close idle connections after 20 seconds
        connect_timeout: 10, // Connection timeout in seconds
      });

      // Initialize Drizzle with the connection and schema
      // Use casing: 'snake_case' to match database column names
      dbInstance = drizzle(client, { 
        schema,
        casing: 'snake_case'
      });

      submitLogEvent('database', 'Database connection established successfully', null);
    } catch (error) {
      submitLogEvent('database', `Failed to establish database connection: ${error instanceof Error ? error.message : 'Unknown error'}`, null, {}, true);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return dbInstance;
}

/**
 * Export the database instance getter
 * This is the main export that should be used throughout the application
 * Using a getter allows the connection to be lazy-loaded at runtime
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = getDb();
    return instance[prop as keyof typeof instance];
  },
});

// Export schema for use in queries
export { schema };
