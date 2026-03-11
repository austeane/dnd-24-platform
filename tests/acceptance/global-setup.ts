import type { FullConfig } from "@playwright/test";
import { seedTavernSessionDatabase } from "../../scripts/seed-tavern-session.ts";

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const databaseUrl = process.env.DATABASE_TEST_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_TEST_URL is required for Tavern acceptance global setup.",
    );
  }

  await seedTavernSessionDatabase({ databaseUrl });
}
