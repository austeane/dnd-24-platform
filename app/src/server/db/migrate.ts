import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getMigrationDatabaseUrl } from "./env.ts";

async function main() {
  const migrationClient = postgres(getMigrationDatabaseUrl(), { max: 1 });

  try {
    const migrationDb = drizzle({ client: migrationClient });
    await migrate(migrationDb, { migrationsFolder: "./drizzle" });
  } finally {
    await migrationClient.end();
  }
}

void main();
