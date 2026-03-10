import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { srdFleetBatches } from "../data/fleet/srd-fleet-batches.ts";
import type { FleetBatch } from "../data/fleet/types.ts";
import { srd2024AtomicMechanicsCoverage } from "../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { srd2024MechanicsCoverage } from "../data/mechanics-coverage/srd-5e-2024.ts";
import {
  checkEvidenceGates,
  type AtomicMechanicsCoverageEntry,
  type CoverageStatus,
} from "../data/mechanics-coverage/types.ts";

const statusOrder: CoverageStatus[] = ["full", "partial", "none"];
const statusLabels: Record<CoverageStatus, string> = {
  full: "Full",
  partial: "Partial",
  none: "None",
};

function countByStatus<T extends { status: CoverageStatus }>(
  entries: T[],
): Record<CoverageStatus, number> {
  return entries.reduce(
    (counts, entry) => {
      counts[entry.status] += 1;
      return counts;
    },
    { full: 0, partial: 0, none: 0 } satisfies Record<CoverageStatus, number>,
  );
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function humanizeId(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function joinInline(values: string[]): string {
  return values.length === 0 ? "" : values.map((value) => `\`${value}\``).join(", ");
}

function getParentLabelMap(): Map<string, string> {
  return new Map(srd2024MechanicsCoverage.map((entry) => [entry.id, entry.name]));
}

function validateAtomic(entries: AtomicMechanicsCoverageEntry[]): void {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`duplicate atomic mechanic id: ${entry.id}`);
    }
    ids.add(entry.id);
  }
}

function validateBatches(
  atomicEntries: AtomicMechanicsCoverageEntry[],
  batches: FleetBatch[],
): void {
  const atomicIds = new Set(atomicEntries.map((entry) => entry.id));
  const batchIds = new Set<string>();

  for (const batch of batches) {
    if (batchIds.has(batch.id)) {
      throw new Error(`duplicate batch id: ${batch.id}`);
    }
    batchIds.add(batch.id);

    for (const dependencyId of batch.dependsOnBatchIds) {
      if (!batches.some((candidate) => candidate.id === dependencyId)) {
        throw new Error(`${batch.id}: unknown dependency batch ${dependencyId}`);
      }
    }

    for (const mechanicId of batch.mechanicIds) {
      if (!atomicIds.has(mechanicId)) {
        throw new Error(`${batch.id}: unknown mechanic id ${mechanicId}`);
      }
    }
  }
}

function pathsOverlap(pathA: string, pathB: string): boolean {
  if (pathA === pathB) return true;
  if (pathA.endsWith("/") && pathB.startsWith(pathA)) return true;
  if (pathB.endsWith("/") && pathA.startsWith(pathB)) return true;
  return false;
}

interface PathCollision {
  pathA: string;
  pathB: string;
  batchA: string;
  batchB: string;
}

function findExactPathCollisions(batches: FleetBatch[]): Map<string, string[]> {
  const owners = new Map<string, string[]>();
  for (const batch of batches) {
    for (const ownedPath of batch.ownedPaths) {
      const currentOwners = owners.get(ownedPath) ?? [];
      currentOwners.push(batch.id);
      owners.set(ownedPath, currentOwners);
    }
  }

  return new Map(
    [...owners.entries()]
      .filter(([, ownerIds]) => unique(ownerIds).length > 1)
      .map(([ownedPath, ownerIds]) => [ownedPath, unique(ownerIds)]),
  );
}

function findWavePathCollisions(batches: FleetBatch[]): PathCollision[] {
  const collisions: PathCollision[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < batches.length; i++) {
    for (let j = i + 1; j < batches.length; j++) {
      const batchA = batches[i];
      const batchB = batches[j];

      for (const pathA of batchA.ownedPaths) {
        for (const pathB of batchB.ownedPaths) {
          if (pathsOverlap(pathA, pathB)) {
            const key = `${batchA.id}:${batchB.id}:${pathA}:${pathB}`;
            if (!seen.has(key)) {
              seen.add(key);
              collisions.push({
                pathA,
                pathB,
                batchA: batchA.id,
                batchB: batchB.id,
              });
            }
          }
        }
      }
    }
  }

  return collisions;
}

/** Within a wave, batches that depend on each other are sequential, not parallel. Group by independence. */
function getParallelGroups(waveBatches: FleetBatch[]): FleetBatch[][] {
  const waveIds = new Set(waveBatches.map((batch) => batch.id));
  // Filter out intra-wave dependencies — those batches are sequential
  const independent = waveBatches.filter(
    (batch) => !batch.dependsOnBatchIds.some((depId) => waveIds.has(depId)),
  );
  // All independent batches in a wave could run in parallel
  return independent.length >= 2 ? [independent] : [];
}

function buildAtomicMarkdown(entries: AtomicMechanicsCoverageEntry[]): string {
  const parentLabels = getParentLabelMap();
  const totalCounts = countByStatus(entries);
  const groupedByArea = new Map<string, AtomicMechanicsCoverageEntry[]>();

  for (const entry of entries) {
    const areaEntries = groupedByArea.get(entry.area) ?? [];
    areaEntries.push(entry);
    groupedByArea.set(entry.area, areaEntries);
  }

  const lines: string[] = [
    "# SRD Mechanics Coverage (Atomic)",
    "",
    "This tracker is the execution truth for agent work. It is intentionally more granular than the coarse product-level tracker.",
    "",
    "Status rule:",
    "",
    "- `Full`: closed with evidence, not just partial support or canon presence.",
    "- `Partial`: some support exists, but the mechanic still leaks to manual notes, missing state, or missing execution.",
    "- `None`: no defensible implementation yet.",
    "",
    "## Summary",
    "",
    `- Total atomic mechanics: ${entries.length}`,
    ...statusOrder.map((status) => `- ${statusLabels[status]}: ${totalCounts[status]}`),
    "",
  ];

  for (const [area, areaEntries] of [...groupedByArea.entries()].sort((left, right) =>
    left[0].localeCompare(right[0])
  )) {
    const counts = countByStatus(areaEntries);
    lines.push(`## ${area}`);
    lines.push("");
    lines.push(
      `- Total: ${areaEntries.length}`,
      `- Full: ${counts.full}`,
      `- Partial: ${counts.partial}`,
      `- None: ${counts.none}`,
      "",
      "| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |",
      "| --- | --- | --- | --- | --- | --- |",
    );

    for (const entry of areaEntries) {
      lines.push(
        `| ${parentLabels.get(entry.parentId) ?? humanizeId(entry.parentId)} | ${entry.name} | ${statusLabels[entry.status]} | ${joinInline(entry.dependsOn ?? [])} | ${joinInline(entry.verificationGates)} | ${joinInline(entry.refs ?? [])} |`,
      );
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildFleetReadinessMarkdown(
  entries: AtomicMechanicsCoverageEntry[],
  batches: FleetBatch[],
): string {
  const counts = countByStatus(entries);
  const readyNow = batches.filter((batch) => batch.dependsOnBatchIds.length === 0);
  const blocked = batches.filter((batch) => batch.dependsOnBatchIds.length > 0);
  const readyNowCollisions = findExactPathCollisions(readyNow);
  const dependentCounts = new Map<string, number>();

  for (const batch of batches) {
    for (const dependencyId of batch.dependsOnBatchIds) {
      dependentCounts.set(dependencyId, (dependentCounts.get(dependencyId) ?? 0) + 1);
    }
  }

  const bottlenecks = [...dependentCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3);

  const lines: string[] = [
    "# Fleet Readiness",
    "",
    "This report is the handoff deck for parallel agent execution.",
    "",
    "## Summary",
    "",
    `- Atomic mechanics: ${entries.length} total, ${counts.full} full, ${counts.partial} partial, ${counts.none} none`,
    `- Fleet batches: ${batches.length} total`,
    `- Ready now: ${readyNow.length}`,
    `- Blocked on dependencies: ${blocked.length}`,
    `- CSV handoff: \`docs/reports/fleet-work-items.csv\``,
    "",
  ];

  if (bottlenecks.length > 0) {
    lines.push("## Bottlenecks", "");
    for (const [batchId, dependentCount] of bottlenecks) {
      const batch = batches.find((candidate) => candidate.id === batchId);
      lines.push(
        `- \`${batchId}\`${batch ? ` (${batch.title})` : ""}: blocks ${dependentCount} downstream batch${dependentCount === 1 ? "" : "es"}`,
      );
    }
    lines.push("");
  }

  lines.push("## Ready Now", "");
  lines.push("| Batch | Lane | Goal | Owned Paths | Gates |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const batch of readyNow) {
    lines.push(
      `| \`${batch.id}\` | ${batch.lane} | ${batch.goal} | ${joinInline(batch.ownedPaths)} | ${joinInline(batch.verificationGates)} |`,
    );
  }
  lines.push("");

  lines.push("## Ready-Now Write Scope Check", "");
  if (readyNowCollisions.size === 0) {
    lines.push("- No exact owned-path collisions across ready-now batches.", "");
  } else {
    for (const [ownedPath, ownerIds] of readyNowCollisions.entries()) {
      lines.push(`- \`${ownedPath}\` is claimed by ${joinInline(ownerIds)}`);
    }
    lines.push("");
  }

  const batchesByWave = new Map<number, FleetBatch[]>();
  for (const batch of batches) {
    const waveBatches = batchesByWave.get(batch.wave) ?? [];
    waveBatches.push(batch);
    batchesByWave.set(batch.wave, waveBatches);
  }

  for (const [wave, waveBatches] of [...batchesByWave.entries()].sort((left, right) =>
    left[0] - right[0]
  )) {
    lines.push(`## Wave ${wave}`, "");
    lines.push("| Batch | Lane | Depends On | Mechanics |");
    lines.push("| --- | --- | --- | --- |");
    for (const batch of waveBatches.sort((left, right) => left.id.localeCompare(right.id))) {
      lines.push(
        `| \`${batch.id}\` | ${batch.lane} | ${joinInline(batch.dependsOnBatchIds)} | ${joinInline(batch.mechanicIds)} |`,
      );
    }
    lines.push("");

    // Check for write-scope collisions within this wave (only among truly parallel batches)
    const parallelGroups = getParallelGroups(waveBatches);
    for (const group of parallelGroups) {
      if (group.length < 2) continue;
      const collisions = findWavePathCollisions(group);
      if (collisions.length > 0) {
        lines.push(`### Wave ${wave} Write-Scope Collisions`, "");
        lines.push("These batches can run in parallel but share write paths. Resolve before launching this wave by splitting files or serializing the batches.", "");
        lines.push("| Path A | Path B | Batch A | Batch B |");
        lines.push("| --- | --- | --- | --- |");
        for (const collision of collisions) {
          const displayPath = collision.pathA === collision.pathB
            ? collision.pathA
            : collision.pathA;
          const displayPathB = collision.pathA === collision.pathB
            ? collision.pathA
            : collision.pathB;
          lines.push(`| \`${displayPath}\` | \`${displayPathB}\` | \`${collision.batchA}\` | \`${collision.batchB}\` |`);
        }
        lines.push("");
      }
    }
  }

  lines.push("## Execution Notes", "");
  lines.push("- Parallelize across ready-now batches first.");
  lines.push("- If a later batch needs a file already claimed by another batch in the same wave, serialize by lane or split the file first.");
  lines.push("- Do not mark a mechanic `full` without linked tests, fixtures, or live-roster evidence.");
  lines.push("- Keep UI out of scope until these non-UI batches are closed.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

function buildBatchCsv(batches: FleetBatch[]): string {
  const headers = [
    "batch_id",
    "wave",
    "lane",
    "title",
    "goal",
    "depends_on_batch_ids",
    "mechanic_ids",
    "owned_paths",
    "plan_refs",
    "verification_gates",
    "verification_steps",
    "prompt_hints",
  ];

  const rows = batches.map((batch) => [
    batch.id,
    String(batch.wave),
    batch.lane,
    batch.title,
    batch.goal,
    batch.dependsOnBatchIds.join(" | "),
    batch.mechanicIds.join(" | "),
    batch.ownedPaths.join(" | "),
    batch.planRefs.join(" | "),
    batch.verificationGates.join(" | "),
    batch.verificationSteps.join(" | "),
    batch.promptHints.join(" | "),
  ]);

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n") + "\n";
}

async function main(): Promise<void> {
  validateAtomic(srd2024AtomicMechanicsCoverage);
  validateBatches(srd2024AtomicMechanicsCoverage, srdFleetBatches);

  // Evidence gate enforcement: warn (or fail with --strict) if full mechanics lack evidence
  const evidenceViolations = checkEvidenceGates(srd2024AtomicMechanicsCoverage);
  if (evidenceViolations.length > 0) {
    process.stderr.write(
      `\nEvidence gate violations (${evidenceViolations.length}):\n`,
    );
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
  await writeFile(atomicPath, buildAtomicMarkdown(srd2024AtomicMechanicsCoverage), "utf8");
  await writeFile(
    readinessPath,
    buildFleetReadinessMarkdown(srd2024AtomicMechanicsCoverage, srdFleetBatches),
    "utf8",
  );
  await writeFile(csvPath, buildBatchCsv(srdFleetBatches), "utf8");

  const counts = countByStatus(srd2024AtomicMechanicsCoverage);
  process.stdout.write(
    `Wrote ${atomicPath}\nWrote ${readinessPath}\nWrote ${csvPath}\nAtomic mechanics: ${srd2024AtomicMechanicsCoverage.length} total, ${counts.full} full, ${counts.partial} partial, ${counts.none} none\nFleet batches: ${srdFleetBatches.length} total, ${srdFleetBatches.filter((batch) => batch.dependsOnBatchIds.length === 0).length} ready now\n`,
  );
}

await main();
