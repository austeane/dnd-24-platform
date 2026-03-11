const requiredPublicTables = [
  "campaigns",
  "sessions",
  "characters",
  "character_sources",
  "character_spend_plans",
  "character_skill_choices",
  "character_feat_choices",
  "character_equipment",
  "character_weapon_masteries",
  "character_metamagic_choices",
  "character_pact_blade_bonds",
  "character_resource_pools",
  "resource_events",
  "character_conditions",
  "condition_events",
  "communication_items",
  "communication_refs",
  "communication_targets",
  "communication_events",
  "xp_transactions",
  "access_credentials",
  "access_sessions",
] as const;

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or DATABASE_PUBLIC_URL is required. Run this under `railway run` or export a Railway Postgres URL first.",
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_PUBLIC_URL = databaseUrl;
  return databaseUrl;
}

async function main(): Promise<void> {
  getDatabaseUrl();
  const { client } = await import("../app/src/server/db/index.ts");

  try {
    const [tableRows, counts, migrationRows] = await Promise.all([
      client<Array<{ tablename: string }>>`
        select tablename
        from pg_tables
        where schemaname = 'public'
        order by tablename
      `,
      client<Array<{ campaigns: number; characters: number; sessions: number }>>`
        select
          case when exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'campaigns')
            then (select count(*)::int from campaigns)
            else 0
          end as campaigns,
          case when exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'characters')
            then (select count(*)::int from characters)
            else 0
          end as characters,
          case when exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'sessions')
            then (select count(*)::int from sessions)
            else 0
          end as sessions
      `,
      client<Array<{ exists: boolean }>>`
        select exists (
          select 1
          from information_schema.tables
          where table_schema = 'drizzle'
            and table_name = '__drizzle_migrations'
        )
      `,
    ]);

    const publicTables = new Set(tableRows.map((row) => row.tablename));
    const missingPublicTables = requiredPublicTables.filter(
      (tableName) => !publicTables.has(tableName),
    );
    const hasMigrationTable = migrationRows[0]?.exists ?? false;
    const summary = {
      publicTableCount: publicTables.size,
      missingPublicTables,
      hasDrizzleMigrations: hasMigrationTable,
      campaigns: counts[0]?.campaigns ?? 0,
      characters: counts[0]?.characters ?? 0,
      sessions: counts[0]?.sessions ?? 0,
    };

    if (missingPublicTables.length > 0 || !hasMigrationTable) {
      throw new Error(
        [
          "Railway Tavern smoke failed schema parity checks.",
          `Public tables found: ${summary.publicTableCount}`,
          `Missing public tables: ${missingPublicTables.length > 0 ? missingPublicTables.join(", ") : "(none)"}`,
          `Drizzle migrations present: ${hasMigrationTable}`,
          `Counts: campaigns=${summary.campaigns}, characters=${summary.characters}, sessions=${summary.sessions}`,
          "Skipped Tavern read-model smoke because schema parity is incomplete.",
        ].join("\n"),
      );
    }

    const [{ getHomeData }, { getCharacterShellData }, { getCompendiumData }] =
      await Promise.all([
        import("../app/src/server/tavern/home.ts"),
        import("../app/src/server/tavern/character-shell.ts"),
        import("../app/src/server/tavern/compendium.ts"),
      ]);

    const home = await getHomeData();
    const firstCharacter = home.campaigns[0]?.roster[0];
    if (!firstCharacter) {
      throw new Error(
        "Railway Tavern smoke found schema parity, but no roster character was available for read-model verification.",
      );
    }

    const [shell, compendium] = await Promise.all([
      getCharacterShellData(firstCharacter.characterId),
      getCompendiumData({
        characterId: firstCharacter.characterId,
        q: "hex",
      }),
    ]);

    if (!shell) {
      throw new Error(
        `Railway Tavern smoke could not resolve shell data for ${firstCharacter.characterId}.`,
      );
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          ...summary,
          smokeCharacter: {
            id: firstCharacter.characterId,
            slug: firstCharacter.characterSlug,
            name: firstCharacter.characterName,
          },
          shell: {
            campaignName: shell.campaign.name,
            level: shell.summary.level,
            spellGroups: shell.spellbook.groups.length,
          },
          compendium: {
            totalCount: compendium.totalCount,
            availablePacks: compendium.availablePacks,
          },
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

await main();
