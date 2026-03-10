import type { VerificationGateId } from "../mechanics-coverage/types.ts";

export const fleetLanes = [
  "content",
  "runtime",
  "progression",
  "rules",
  "verification",
] as const;
export type FleetLane = (typeof fleetLanes)[number];

export interface FleetBatch {
  id: string;
  wave: number;
  lane: FleetLane;
  title: string;
  goal: string;
  dependsOnBatchIds: string[];
  mechanicIds: string[];
  ownedPaths: string[];
  planRefs: string[];
  verificationGates: VerificationGateId[];
  verificationSteps: string[];
  promptHints: string[];
}
