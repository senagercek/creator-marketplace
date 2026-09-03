import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/server/db";
import * as dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Failed to run migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
