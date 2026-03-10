import { describe, expect, it } from "vitest";
import { srd2024MechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024.ts";
import { srd2024AtomicMechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { srdFleetBatches } from "../../../data/fleet/srd-fleet-batches.ts";
import type { MechanicsCoverageEntry } from "../../../data/mechanics-coverage/types.ts";
import type { AtomicMechanicsCoverageEntry, CoverageStatus } from "../../../data/mechanics-coverage/types.ts";
import type { FleetBatch } from "../../../data/fleet/types.ts";

// --- Helpers that mirror the report scripts, operating on data only ---

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

function buildCoarseMarkdown(entries: MechanicsCoverageEntry[]): string {
  const totalCounts = countByStatus(entries);
  const grouped = new Map<string, MechanicsCoverageEntry[]>();
  for (const entry of entries) {
    const areaEntries = grouped.get(entry.area) ?? [];
    areaEntries.push(entry);
    grouped.set(entry.area, areaEntries);
  }

  const lines: string[] = [
    "# SRD Mechanics Coverage",
    "",
    `- Total tracked mechanics: ${entries.length}`,
    `- Full: ${totalCounts.full}`,
    `- Partial: ${totalCounts.partial}`,
    `- None: ${totalCounts.none}`,
  ];

  for (const [area, areaEntries] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${area}: ${areaEntries.length}`);
  }

  return lines.join("\n");
}

function buildAtomicSummary(entries: AtomicMechanicsCoverageEntry[]): string {
  const counts = countByStatus(entries);
  return `atomic:${entries.length},full:${counts.full},partial:${counts.partial},none:${counts.none}`;
}

function buildFleetSummary(batches: FleetBatch[]): string {
  const readyNow = batches.filter((b) => b.dependsOnBatchIds.length === 0).length;
  return `batches:${batches.length},ready:${readyNow}`;
}

// --- Determinism tests ---

describe("report determinism", () => {
  it("coarse mechanics report is identical across two runs", () => {
    const run1 = buildCoarseMarkdown(srd2024MechanicsCoverage);
    const run2 = buildCoarseMarkdown(srd2024MechanicsCoverage);
    expect(run1).toBe(run2);
  });

  it("atomic mechanics summary is identical across two runs", () => {
    const run1 = buildAtomicSummary(srd2024AtomicMechanicsCoverage);
    const run2 = buildAtomicSummary(srd2024AtomicMechanicsCoverage);
    expect(run1).toBe(run2);
  });

  it("fleet readiness summary is identical across two runs", () => {
    const run1 = buildFleetSummary(srdFleetBatches);
    const run2 = buildFleetSummary(srdFleetBatches);
    expect(run1).toBe(run2);
  });

  it("coarse mechanics data has no duplicate IDs", () => {
    const ids = srd2024MechanicsCoverage.map((e) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("atomic mechanics data has no duplicate IDs", () => {
    const ids = srd2024AtomicMechanicsCoverage.map((e) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("fleet batch data has no duplicate IDs", () => {
    const ids = srdFleetBatches.map((b) => b.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("all batch mechanic IDs reference valid atomic mechanic IDs", () => {
    const atomicIds = new Set(srd2024AtomicMechanicsCoverage.map((e) => e.id));
    for (const batch of srdFleetBatches) {
      for (const mechanicId of batch.mechanicIds) {
        expect(atomicIds.has(mechanicId), `${batch.id}: unknown mechanic ${mechanicId}`).toBe(true);
      }
    }
  });

  it("all batch dependency IDs reference valid batch IDs", () => {
    const batchIds = new Set(srdFleetBatches.map((b) => b.id));
    for (const batch of srdFleetBatches) {
      for (const depId of batch.dependsOnBatchIds) {
        expect(batchIds.has(depId), `${batch.id}: unknown dependency ${depId}`).toBe(true);
      }
    }
  });
});
