export const coverageStatuses = ["full", "partial", "none"] as const;
export type CoverageStatus = (typeof coverageStatuses)[number];

export const atomicCoverageKinds = ["runtime", "content", "data", "test", "infra"] as const;
export type AtomicCoverageKind = (typeof atomicCoverageKinds)[number];

export const verificationGateIds = [
  "canon",
  "runtime",
  "persistence",
  "mutation",
  "explainability",
  "tests",
  "fixtures",
  "live-roster",
] as const;
export type VerificationGateId = (typeof verificationGateIds)[number];

export interface MechanicsCoverageEntry {
  id: string;
  area: string;
  name: string;
  status: CoverageStatus;
  summary: string;
  refs?: string[];
}

export interface AtomicMechanicsCoverageEntry {
  id: string;
  parentId: string;
  area: string;
  name: string;
  status: CoverageStatus;
  kind: AtomicCoverageKind;
  summary: string;
  dependsOn?: string[];
  refs?: string[];
  verificationGates: VerificationGateId[];
}

/** Evidence gate patterns: a ref matching any of these indicates test/fixture/snapshot evidence. */
const evidencePatterns = [
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /tests\//,
  /snapshots\//,
  /fixtures\//,
  /verified-characters\.json$/,
] as const;

export interface EvidenceGateViolation {
  id: string;
  name: string;
  status: CoverageStatus;
  gates: VerificationGateId[];
  refs: string[];
  reason: string;
}

/** Check that `full` mechanics have at least one evidence ref (test, fixture, or snapshot). */
export function checkEvidenceGates(
  entries: AtomicMechanicsCoverageEntry[],
): EvidenceGateViolation[] {
  const violations: EvidenceGateViolation[] = [];

  for (const entry of entries) {
    if (entry.status !== "full") continue;

    const entryRefs = entry.refs ?? [];
    const hasEvidenceRef = entryRefs.some((ref) =>
      evidencePatterns.some((pattern) => pattern.test(ref)),
    );

    if (!hasEvidenceRef) {
      violations.push({
        id: entry.id,
        name: entry.name,
        status: entry.status,
        gates: entry.verificationGates,
        refs: entryRefs,
        reason: "Marked `full` but has no linked test, fixture, or snapshot evidence.",
      });
    }
  }

  return violations;
}
