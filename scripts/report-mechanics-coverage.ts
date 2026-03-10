import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { srd2024MechanicsCoverage } from "../data/mechanics-coverage/srd-5e-2024.ts";
import { buildCoarseCoverageMarkdown, countByStatus } from "./lib/report-builders.ts";

async function main(): Promise<void> {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const reportDir = path.join(rootDir, "docs", "reports");
  const reportPath = path.join(reportDir, "srd-mechanics-coverage.md");
  const markdown = buildCoarseCoverageMarkdown(srd2024MechanicsCoverage);

  await mkdir(reportDir, { recursive: true });
  await writeFile(reportPath, markdown, "utf8");

  const counts = countByStatus(srd2024MechanicsCoverage);
  process.stdout.write(
    `Wrote ${reportPath}\nTracked mechanics: ${srd2024MechanicsCoverage.length} total, ${counts.full} full, ${counts.partial} partial, ${counts.none} none\n`,
  );
}

await main();
