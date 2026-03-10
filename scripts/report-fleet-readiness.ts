import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { srdFleetBatches } from "../data/fleet/srd-fleet-batches.ts";
import { srd2024AtomicMechanicsCoverage } from "../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { srd2024MechanicsCoverage } from "../data/mechanics-coverage/srd-5e-2024.ts";
import { checkEvidenceGates } from "../data/mechanics-coverage/types.ts";
import {
  buildAtomicCoverageMarkdown,
  buildFleetBatchCsv,
  buildFleetReadinessMarkdown,
  countByStatus,
  validateAtomicEntries,
  validateFleetBatches,
} from "./lib/report-builders.ts";

async function main(): Promise<void> {
  validateAtomicEntries(srd2024AtomicMechanicsCoverage);
  validateFleetBatches(srd2024AtomicMechanicsCoverage, srdFleetBatches);

  const evidenceViolations = checkEvidenceGates(srd2024AtomicMechanicsCoverage);
  if (evidenceViolations.length > 0) {
    process.stderr.write(`\nEvidence gate violations (${evidenceViolations.length}):\n`);
    for (const violation of evidenceViolations) {
      process.stderr.write(
        `  ${violation.id}: ${violation.reason} refs=[${violation.refs.join(", ")}]\n`,
      );
    }
    if (process.argv.includes("--strict")) {
      process.exitCode = 1;
      return;
    }
    process.stderr.write("  (pass --strict to fail on violations)\n\n");
  }

  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const reportDir = path.join(rootDir, "docs", "reports");
  const atomicPath = path.join(reportDir, "srd-mechanics-coverage-atomic.md");
  const readinessPath = path.join(reportDir, "fleet-readiness.md");
  const csvPath = path.join(reportDir, "fleet-work-items.csv");

  await mkdir(reportDir, { recursive: true });
  await writeFile(
    atomicPath,
    buildAtomicCoverageMarkdown(srd2024AtomicMechanicsCoverage, srd2024MechanicsCoverage),
    "utf8",
  );
  await writeFile(
    readinessPath,
    buildFleetReadinessMarkdown(srd2024AtomicMechanicsCoverage, srdFleetBatches),
    "utf8",
  );
  await writeFile(csvPath, buildFleetBatchCsv(srdFleetBatches), "utf8");

  const counts = countByStatus(srd2024AtomicMechanicsCoverage);
  process.stdout.write(
    `Wrote ${atomicPath}\nWrote ${readinessPath}\nWrote ${csvPath}\nAtomic mechanics: ${srd2024AtomicMechanicsCoverage.length} total, ${counts.full} full, ${counts.partial} partial, ${counts.none} none\nFleet batches: ${srdFleetBatches.length} total, ${srdFleetBatches.filter((batch) => batch.dependsOnBatchIds.length === 0).length} ready now\n`,
  );
}

await main();
