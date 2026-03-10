import { describe, expect, it } from "vitest";
import {
  getCharacterSpendPlanTotalXpCost,
  parseCharacterSpendPlanDocument,
} from "./plan-document.ts";

describe("parseCharacterSpendPlanDocument", () => {
  it("normalizes mixed spend-plan operations", () => {
    const document = parseCharacterSpendPlanDocument({
      version: 1,
      operations: [
        {
          type: "class-level",
          classEntityId: "class:warlock",
          classPackId: "srd-5e-2024",
          levelsGranted: 1,
          xpCost: 5,
        },
        {
          type: "canonical-source",
          sourceKind: "feat",
          entityId: "feat:magic-initiate",
          packId: "srd-5e-2024",
          xpCost: 2,
          notes: ["picked from sheet review"],
        },
        {
          type: "spell-access",
          spellName: "Hex",
          sourceKind: "class-feature",
          sourceLabel: "Species Magic",
          xpCost: 0,
        },
      ],
    });

    expect(document.version).toBe(1);
    expect(document.operations).toHaveLength(3);
    expect(getCharacterSpendPlanTotalXpCost(document)).toBe(7);
  });

  it("rejects unsupported source kinds and versions", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 2,
        operations: [],
      }),
    ).toThrow("planJson.version");

    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "canonical-source",
            sourceKind: "override",
            entityId: "seed:anything",
            packId: "srd-5e-2024",
            xpCost: 0,
          },
        ],
      }),
    ).toThrow("unsupported spend-plan source kind");
  });
});
