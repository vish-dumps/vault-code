// Database configuration - currently using memory storage
// Uncomment below when ready to use PostgreSQL/Neon database

/*
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
*/

// For now, we're using memory storage (see storage.ts)
// This allows the app to run without a database connection
export const db = null;
