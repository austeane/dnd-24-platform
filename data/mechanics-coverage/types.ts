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
