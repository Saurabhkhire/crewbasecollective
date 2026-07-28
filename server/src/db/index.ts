import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Use your Supabase Postgres connection string.");
}

// prepare: false is required for Supabase transaction pooler (port 6543 / PgBouncer)
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1, // good default for Vercel serverless
});

export const db = drizzle(client, { schema });
