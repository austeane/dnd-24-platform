import { describe, expect, it } from "vitest";
import { srd2024AtomicMechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { checkEvidenceGates, classifyEvidenceRefs } from "../../../data/mechanics-coverage/types.ts";

describe("evidence gate enforcement", () => {
  it("every `full` atomic mechanic has explicit evidence for each required gate", () => {
    const violations = checkEvidenceGates(srd2024AtomicMechanicsCoverage);

    if (violations.length > 0) {
      const summary = violations
        .map((violation) => `  ${violation.id}: ${violation.reason} refs=[${violation.refs.join(", ")}]`)
        .join("\n");
      expect.fail(
        `${violations.length} mechanic(s) marked \`full\` without gate-specific evidence:\n${summary}`,
      );
    }
  });

  it("checkEvidenceGates catches entries missing a required gate bucket", () => {
    const violations = checkEvidenceGates([
      {
        id: "test-no-live-roster",
        parentId: "parent",
        area: "Test",
        name: "No Live Roster",
        status: "full",
        kind: "runtime",
        summary: "Missing DB-backed acceptance evidence.",
        refs: ["library/tests/verification/fixture-roster-snapshot.test.ts"],
        verificationGates: ["runtime", "tests", "live-roster"],
        evidence: classifyEvidenceRefs(["library/tests/verification/fixture-roster-snapshot.test.ts"]),
      },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.id).toBe("test-no-live-roster");
  });

  it("checkEvidenceGates passes entries with explicit integration evidence", () => {
    const refs = [
      "library/src/engine/character-computer.ts",
      "app/src/server/progression/runtime-state.integration.test.ts",
    ];

    const violations = checkEvidenceGates([
      {
        id: "test-with-live-roster",
        parentId: "parent",
        area: "Test",
        name: "Has Live Roster",
        status: "full",
        kind: "runtime",
        summary: "Has gate-specific evidence.",
        refs,
        verificationGates: ["runtime", "tests", "live-roster", "mutation"],
        evidence: classifyEvidenceRefs(refs),
      },
    ]);

    expect(violations).toHaveLength(0);
  });

  it("checkEvidenceGates ignores partial and none entries", () => {
    const violations = checkEvidenceGates([
      {
        id: "test-partial",
        parentId: "parent",
        area: "Test",
        name: "Partial",
        status: "partial",
        kind: "runtime",
        summary: "Partial coverage.",
        refs: [],
        verificationGates: ["runtime", "tests"],
        evidence: classifyEvidenceRefs([]),
      },
      {
        id: "test-none",
        parentId: "parent",
        area: "Test",
        name: "None",
        status: "none",
        kind: "runtime",
        summary: "No coverage.",
        refs: [],
        verificationGates: ["runtime", "tests"],
        evidence: classifyEvidenceRefs([]),
      },
    ]);

    expect(violations).toHaveLength(0);
  });
});
