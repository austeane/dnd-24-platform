import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFixtureRosterSnapshotDocument } from "./lib/roster-snapshots.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotDir = path.join(rootDir, "data", "fleet", "snapshots");
const baselinePath = path.join(snapshotDir, "fixture-roster-baseline.json");
const latestPath = path.join(snapshotDir, "fixture-roster-latest.json");

async function main(): Promise<void> {
  const shouldUpdate = process.argv.includes("--update");
  const shouldCheck = process.argv.includes("--check");
  const latestJson = `${JSON.stringify(buildFixtureRosterSnapshotDocument(), null, 2)}\n`;

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
      `Fixture roster snapshot drift detected.\nBaseline: ${baselinePath}\nLatest: ${latestPath}\n`,
    );
    if (shouldCheck) {
      process.exitCode = 1;
      return;
    }
  }

  process.stdout.write(`Wrote ${latestPath}\nFixture roster snapshot matches baseline.\n`);
}

await main();
