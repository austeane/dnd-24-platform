import path from "node:path";
import { fileURLToPath } from "node:url";

export interface TavernSessionSeedSummary {
  campaignId: string;
  characterId: string;
  sessionId: string;
  communicationId: string;
  before: {
    slug: string;
    level: number;
    journalCards: number;
    spendPlans: number;
  };
  after: {
    slug: string;
    level: number;
    journalCards: number;
    spendPlans: number;
    xpTransactions: number;
  };
  counts: {
    campaigns: number;
    characters: number;
    sessions: number;
  };
}

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL ??
    process.env.DATABASE_URL ??
    process.env.DATABASE_TEST_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_PUBLIC_URL, DATABASE_URL, or DATABASE_TEST_URL is required.",
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_PUBLIC_URL = databaseUrl;
  process.env.DATABASE_TEST_URL = databaseUrl;
  return databaseUrl;
}

function requireDestructiveFlag(): void {
  const allowed = process.argv.includes("--destructive");
  if (!allowed) {
    throw new Error(
      "This script truncates the current database. Re-run with --destructive to continue.",
    );
  }
}

export async function seedTavernSessionDatabase(options?: {
  databaseUrl?: string;
}): Promise<TavernSessionSeedSummary> {
  const databaseUrl = options?.databaseUrl ?? getDatabaseUrl();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_PUBLIC_URL = databaseUrl;
  process.env.DATABASE_TEST_URL = databaseUrl;

  const [
    { client },
    { runMigrations },
    { resetAndSeedRealCampaign },
    { runTavernSessionScenario },
  ] = await Promise.all([
    import("../app/src/server/db/index.ts"),
    import("../app/src/server/db/migrate.ts"),
    import("../app/src/server/test/integration-helpers.ts"),
    import("../app/src/server/tavern/session-scenario-runner.ts"),
  ]);

  try {
    await runMigrations({ databaseUrl });
    await resetAndSeedRealCampaign();
    const result = await runTavernSessionScenario();
    const counts = await client<Array<{ campaigns: number; characters: number; sessions: number }>>`
      select
        (select count(*)::int from campaigns) as campaigns,
        (select count(*)::int from characters) as characters,
        (select count(*)::int from sessions) as sessions
    `;

    const summary: TavernSessionSeedSummary = {
      campaignId: result.campaignId,
      characterId: result.characterId,
      sessionId: result.sessionId,
      communicationId: result.communicationId,
      before: {
        slug: result.before.shell.character.slug,
        level: result.before.shell.summary.level,
        journalCards: result.before.journal.cards.length,
        spendPlans: result.before.spendPlans.length,
      },
      after: {
        slug: result.after.shell.character.slug,
        level: result.after.shell.summary.level,
        journalCards: result.after.journal.cards.length,
        spendPlans: result.after.spendPlans.length,
        xpTransactions: result.after.xpTransactions.length,
      },
      counts: counts[0] ?? {
        campaigns: 0,
        characters: 0,
        sessions: 0,
      },
    };

    process.stdout.write(
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    return summary;
  } finally {
    await client.end({ timeout: 5 });
  }
}

async function main(): Promise<void> {
  requireDestructiveFlag();
  await seedTavernSessionDatabase();
}

const isMain = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await main();
}
