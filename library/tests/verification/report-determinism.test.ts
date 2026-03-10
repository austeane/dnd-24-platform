import { describe, expect, it } from "vitest";
import { srdFleetBatches } from "../../../data/fleet/srd-fleet-batches.ts";
import { srd2024AtomicMechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { srd2024MechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024.ts";
import {
  buildAtomicCoverageMarkdown,
  buildCoarseCoverageMarkdown,
  buildFleetBatchCsv,
  buildFleetReadinessMarkdown,
  validateAtomicEntries,
  validateFleetBatches,
} from "../../../scripts/lib/report-builders.ts";
import { buildFixtureRosterSnapshotDocument } from "../../../scripts/lib/roster-snapshots.ts";

describe("report determinism", () => {
  it("coarse mechanics report builder is identical across two runs", () => {
    const run1 = buildCoarseCoverageMarkdown(srd2024MechanicsCoverage);
    const run2 = buildCoarseCoverageMarkdown(srd2024MechanicsCoverage);
    expect(run1).toBe(run2);
  });

  it("atomic mechanics report builder is identical across two runs", () => {
    const run1 = buildAtomicCoverageMarkdown(srd2024AtomicMechanicsCoverage, srd2024MechanicsCoverage);
    const run2 = buildAtomicCoverageMarkdown(srd2024AtomicMechanicsCoverage, srd2024MechanicsCoverage);
    expect(run1).toBe(run2);
  });

  it("fleet readiness report builder is identical across two runs", () => {
    const run1 = buildFleetReadinessMarkdown(srd2024AtomicMechanicsCoverage, srdFleetBatches);
    const run2 = buildFleetReadinessMarkdown(srd2024AtomicMechanicsCoverage, srdFleetBatches);
    expect(run1).toBe(run2);
  });

  it("fleet batch CSV builder is identical across two runs", () => {
    const run1 = buildFleetBatchCsv(srdFleetBatches);
    const run2 = buildFleetBatchCsv(srdFleetBatches);
    expect(run1).toBe(run2);
  });

  it("fixture roster snapshot builder is identical across two runs", () => {
    const run1 = JSON.stringify(buildFixtureRosterSnapshotDocument());
    const run2 = JSON.stringify(buildFixtureRosterSnapshotDocument());
    expect(run1).toBe(run2);
  });

  it("atomic mechanics data validates through the real builder validation", () => {
    expect(() => validateAtomicEntries(srd2024AtomicMechanicsCoverage)).not.toThrow();
  });

  it("fleet batch data validates through the real builder validation", () => {
    expect(() => validateFleetBatches(srd2024AtomicMechanicsCoverage, srdFleetBatches)).not.toThrow();
  });
});
