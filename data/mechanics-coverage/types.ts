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

export interface AtomicMechanicEvidence {
  canon: string[];
  runtime: string[];
  persistence: string[];
  mutation: string[];
  explainability: string[];
  tests: string[];
  fixtures: string[];
  liveRoster: string[];
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
  evidence: AtomicMechanicEvidence;
}

const explainabilityEvidenceRefs = new Set([
  "library/tests/engine/attacks.test.ts",
  "library/tests/engine/character-computer.test.ts",
  "library/tests/engine/proficiencies.test.ts",
  "library/tests/engine/spellcasting.test.ts",
  "app/src/server/progression/runtime-state.integration.test.ts",
]);

const liveRosterEvidenceRefs = [
  "app/src/server/progression/live-roster.integration.test.ts",
  "app/src/server/progression/runtime-state.integration.test.ts",
  "scripts/snapshot-live-roster.ts",
  "data/fleet/snapshots/live-roster-baseline.json",
  "data/fleet/snapshots/live-roster-latest.json",
];

const mutationEvidenceRefs = [
  "app/src/server/progression/runtime-state.integration.test.ts",
];

const fixtureEvidenceRefs = [
  "data/fleet/fixture-patterns.ts",
  "data/real-campaign-intake/verified-characters.json",
  "library/tests/verification/fixture-roster-snapshot.test.ts",
  "scripts/snapshot-fixture-roster.ts",
  "data/fleet/snapshots/fixture-roster-baseline.json",
  "data/fleet/snapshots/fixture-roster-latest.json",
];

const persistenceRefPrefixes = [
  "app/src/server/db/schema/",
  "app/drizzle/",
];

const runtimeRefPrefixes = [
  "library/src/engine/",
  "app/src/server/progression/",
  "library/src/catalog.ts",
];

const canonRefPrefixes = [
  "content/canon/",
  "library/src/generated/",
];

function createEmptyEvidence(): AtomicMechanicEvidence {
  return {
    canon: [],
    runtime: [],
    persistence: [],
    mutation: [],
    explainability: [],
    tests: [],
    fixtures: [],
    liveRoster: [],
  };
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function matchesAnyPrefix(ref: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => ref.startsWith(prefix));
}

export function classifyEvidenceRefs(refs: string[] | undefined): AtomicMechanicEvidence {
  const evidence = createEmptyEvidence();

  for (const ref of refs ?? []) {
    if (matchesAnyPrefix(ref, canonRefPrefixes)) {
      pushUnique(evidence.canon, ref);
    }

    if (matchesAnyPrefix(ref, runtimeRefPrefixes) || ref === "app/src/server/db/seed-real-campaign.ts") {
      pushUnique(evidence.runtime, ref);
    }

    if (matchesAnyPrefix(ref, persistenceRefPrefixes) || ref === "app/src/server/db/seed-real-campaign.ts") {
      pushUnique(evidence.persistence, ref);
    }

    if (/\.test\.ts$|\.spec\.ts$|\.integration\.test\.ts$/.test(ref)) {
      pushUnique(evidence.tests, ref);
    }

    if (fixtureEvidenceRefs.includes(ref) || ref.includes("fixture-roster")) {
      pushUnique(evidence.fixtures, ref);
    }

    if (liveRosterEvidenceRefs.includes(ref)) {
      pushUnique(evidence.liveRoster, ref);
    }

    if (mutationEvidenceRefs.includes(ref)) {
      pushUnique(evidence.mutation, ref);
    }

    if (explainabilityEvidenceRefs.has(ref)) {
      pushUnique(evidence.explainability, ref);
    }
  }

  return evidence;
}

export function mergeEvidence(
  ...evidenceSets: Array<Partial<AtomicMechanicEvidence> | undefined>
): AtomicMechanicEvidence {
  const merged = createEmptyEvidence();

  for (const evidence of evidenceSets) {
    if (!evidence) {
      continue;
    }

    for (const [key, values] of Object.entries(evidence) as Array<[keyof AtomicMechanicEvidence, string[] | undefined]>) {
      for (const value of values ?? []) {
        pushUnique(merged[key], value);
      }
    }
  }

  return merged;
}

const gateToEvidenceKey = {
  canon: "canon",
  runtime: "runtime",
  persistence: "persistence",
  mutation: "mutation",
  explainability: "explainability",
  tests: "tests",
  fixtures: "fixtures",
  "live-roster": "liveRoster",
} as const satisfies Record<VerificationGateId, keyof AtomicMechanicEvidence>;

export function getMissingEvidenceGates(
  verificationGates: VerificationGateId[],
  evidence: AtomicMechanicEvidence,
): VerificationGateId[] {
  return verificationGates.filter((gate) => evidence[gateToEvidenceKey[gate]].length === 0);
}

export interface EvidenceGateViolation {
  id: string;
  name: string;
  status: CoverageStatus;
  gates: VerificationGateId[];
  refs: string[];
  reason: string;
}

export function checkEvidenceGates(
  entries: AtomicMechanicsCoverageEntry[],
): EvidenceGateViolation[] {
  const violations: EvidenceGateViolation[] = [];

  for (const entry of entries) {
    if (entry.status !== "full") continue;

    const missingGates = getMissingEvidenceGates(entry.verificationGates, entry.evidence);
    if (missingGates.length === 0) {
      continue;
    }

    violations.push({
      id: entry.id,
      name: entry.name,
      status: entry.status,
      gates: entry.verificationGates,
      refs: entry.refs ?? [],
      reason: `Marked \`full\` but missing explicit evidence for ${missingGates.join(", ")}.`,
    });
  }

  return violations;
}
