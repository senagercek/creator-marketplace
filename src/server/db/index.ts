import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/creator_marketplace";

const globalForDb = globalThis as unknown as {
  pool: pg.Pool | undefined;
};

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool =
  globalForDb.pool ??
  new pg.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
