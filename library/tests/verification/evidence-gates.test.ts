import { describe, expect, it } from "vitest";
import { srd2024AtomicMechanicsCoverage } from "../../../data/mechanics-coverage/srd-5e-2024-atomic.ts";
import { checkEvidenceGates } from "../../../data/mechanics-coverage/types.ts";

describe("evidence gate enforcement", () => {
  it("every `full` atomic mechanic has at least one evidence ref", () => {
    const violations = checkEvidenceGates(srd2024AtomicMechanicsCoverage);

    if (violations.length > 0) {
      const summary = violations
        .map((v) => `  ${v.id}: ${v.reason} refs=[${v.refs.join(", ")}]`)
        .join("\n");
      expect.fail(
        `${violations.length} mechanic(s) marked \`full\` without evidence:\n${summary}`,
      );
    }
  });

  it("checkEvidenceGates catches entries without evidence refs", () => {
    const violations = checkEvidenceGates([
      {
        id: "test-no-evidence",
        parentId: "parent",
        area: "Test",
        name: "No Evidence",
        status: "full",
        kind: "runtime",
        summary: "Missing evidence ref.",
        refs: ["library/src/engine/math.ts"],
        verificationGates: ["runtime", "tests"],
      },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]!.id).toBe("test-no-evidence");
  });

  it("checkEvidenceGates passes entries with test refs", () => {
    const violations = checkEvidenceGates([
      {
        id: "test-with-evidence",
        parentId: "parent",
        area: "Test",
        name: "Has Evidence",
        status: "full",
        kind: "runtime",
        summary: "Has test ref.",
        refs: ["library/tests/engine/character-computer.test.ts"],
        verificationGates: ["runtime", "tests"],
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
      },
    ]);

    expect(violations).toHaveLength(0);
  });
});
