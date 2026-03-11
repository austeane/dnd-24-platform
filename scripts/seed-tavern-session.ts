import path from "node:path";
import { fileURLToPath } from "node:url";

export const tavernAccessPasswords = {
  dm: "hearthstone-dm",
  playerBySlug: {
    tali: "tali-player-pass",
    vivennah: "vivennah-player-pass",
  },
} as const;

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
  access: {
    dmPassword: string;
    playerCharacterSlugs: string[];
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
  closeClient?: boolean;
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
    { getCampaignBySlug, listCampaignRoster },
    { setCharacterPassword, setDmPassword },
  ] = await Promise.all([
    import("../app/src/server/db/index.ts"),
    import("../app/src/server/db/migrate.ts"),
    import("../app/src/server/test/integration-helpers.ts"),
    import("../app/src/server/tavern/session-scenario-runner.ts"),
    import("../app/src/server/campaigns/service.ts"),
    import("../app/src/server/auth/service.ts"),
  ]);

  try {
    await runMigrations({ databaseUrl });
    await resetAndSeedRealCampaign();
    const result = await runTavernSessionScenario();
    const campaign = await getCampaignBySlug("real-aa-campaign");
    if (!campaign) {
      throw new Error("real-aa-campaign not found after Tavern seed");
    }
    const roster = await listCampaignRoster(campaign.id);

    await setDmPassword({
      campaignId: campaign.id,
      password: tavernAccessPasswords.dm,
      actorLabel: "tavern-seed",
    });

    for (const [slug, password] of Object.entries(tavernAccessPasswords.playerBySlug)) {
      const character = roster.find((entry) => entry.slug === slug);
      if (!character) {
        throw new Error(`Character ${slug} not found while seeding Tavern access`);
      }

      await setCharacterPassword({
        campaignId: campaign.id,
        characterId: character.id,
        password,
        actorLabel: "tavern-seed",
      });
    }

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
      access: {
        dmPassword: tavernAccessPasswords.dm,
        playerCharacterSlugs: Object.keys(tavernAccessPasswords.playerBySlug),
      },
    };

    process.stdout.write(
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    return summary;
  } finally {
    if (options?.closeClient ?? true) {
      await client.end({ timeout: 5 });
    }
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
