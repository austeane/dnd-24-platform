import { client } from "../db/index.ts";
import { defaultSeedPath, seedVerifiedCampaignFromPath } from "../db/seed-real-campaign.ts";

interface TableNameRow {
  tablename: string;
}

async function listResettableTableNames(): Promise<string[]> {
  const rows = await client<TableNameRow[]>`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> '__drizzle_migrations'
    order by tablename
  `;

  return rows.map((row) => row.tablename);
}

export async function truncateIntegrationTables(): Promise<void> {
  const tableNames = await listResettableTableNames();
  if (tableNames.length === 0) {
    return;
  }

  await client.unsafe(
    `truncate table ${tableNames.map((tableName) => `"${tableName}"`).join(", ")} restart identity cascade`,
  );
}

export async function resetAndSeedRealCampaign(): Promise<void> {
  await truncateIntegrationTables();
  await seedVerifiedCampaignFromPath(defaultSeedPath);
}
