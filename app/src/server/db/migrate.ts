import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getMigrationDatabaseUrl } from "./env.ts";

const defaultMigrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

export async function runMigrations(options?: {
  databaseUrl?: string;
  migrationsFolder?: string;
}): Promise<void> {
  const migrationClient = postgres(
    options?.databaseUrl ?? getMigrationDatabaseUrl(),
    { max: 1 },
  );

  try {
    const migrationDb = drizzle({ client: migrationClient });
    await migrate(migrationDb, {
      migrationsFolder: options?.migrationsFolder ?? defaultMigrationsFolder,
    });
  } finally {
    await migrationClient.end();
  }
}

async function main() {
  await runMigrations();
}

const isMain = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  void main();
}
