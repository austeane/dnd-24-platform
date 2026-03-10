import type { TestProject } from "vitest/node";
import { client } from "../db/index.ts";
import { getTestDatabaseUrl } from "../db/env.ts";
import { runMigrations } from "../db/migrate.ts";

export default async function integrationGlobalSetup(_project: TestProject) {
  await runMigrations({
    databaseUrl: getTestDatabaseUrl(),
  });

  return async () => {
    await client.end({ timeout: 5 });
  };
}
