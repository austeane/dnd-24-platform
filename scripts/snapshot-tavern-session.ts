import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const databaseTestUrl = process.env.DATABASE_TEST_URL;

if (!databaseTestUrl) {
  throw new Error(
    "DATABASE_TEST_URL is required to snapshot the Tavern session scenario.",
  );
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = databaseTestUrl;
process.env.DATABASE_PUBLIC_URL = databaseTestUrl;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotDir = path.join(rootDir, "data", "fleet", "snapshots");
const baselinePath = path.join(snapshotDir, "tavern-session-baseline.json");
const latestPath = path.join(snapshotDir, "tavern-session-latest.json");

async function main(): Promise<void> {
  const shouldUpdate = process.argv.includes("--update");
  const shouldCheck = process.argv.includes("--check");

  const [
    { client },
    { runMigrations },
    { resetAndSeedRealCampaign },
    { runTavernSessionScenario },
    { serializeTavernSessionSnapshot },
  ] = await Promise.all([
    import("../app/src/server/db/index.ts"),
    import("../app/src/server/db/migrate.ts"),
    import("../app/src/server/test/integration-helpers.ts"),
    import("../app/src/server/tavern/session-scenario-runner.ts"),
    import("./lib/tavern-snapshots.ts"),
  ]);

  try {
    await runMigrations({
      databaseUrl: databaseTestUrl,
    });
    await resetAndSeedRealCampaign();
    const latestJson = `${JSON.stringify(
      serializeTavernSessionSnapshot(await runTavernSessionScenario()),
      null,
      2,
    )}\n`;

    await mkdir(snapshotDir, { recursive: true });
    await writeFile(latestPath, latestJson, "utf8");

    let baselineJson: string | null = null;
    try {
      baselineJson = await readFile(baselinePath, "utf8");
    } catch {
      baselineJson = null;
    }

    if (shouldUpdate || baselineJson === null) {
      await writeFile(baselinePath, latestJson, "utf8");
      process.stdout.write(
        `${baselineJson === null ? "Created" : "Updated"} ${baselinePath}\nWrote ${latestPath}\n`,
      );
      return;
    }

    if (baselineJson !== latestJson) {
      process.stderr.write(
        `Tavern session snapshot drift detected.\nBaseline: ${baselinePath}\nLatest: ${latestPath}\n`,
      );
      if (shouldCheck) {
        process.exitCode = 1;
        return;
      }
    }

    process.stdout.write(
      `Wrote ${latestPath}\nTavern session snapshot matches baseline.\n`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

await main();
