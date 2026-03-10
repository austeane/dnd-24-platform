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

  it("rejects non-object input", () => {
    expect(() => parseCharacterSpendPlanDocument("not an object")).toThrow("expected object");
    expect(() => parseCharacterSpendPlanDocument(null)).toThrow("expected object");
    expect(() => parseCharacterSpendPlanDocument(42)).toThrow("expected object");
  });

  it("rejects empty operations array", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({ version: 1, operations: [] }),
    ).toThrow("expected at least one operation");
  });

  it("rejects missing version", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        operations: [
          { type: "class-level", classEntityId: "class:warlock", classPackId: "srd-5e-2024", levelsGranted: 1, xpCost: 0 },
        ],
      }),
    ).toThrow("planJson.version");
  });

  it("rejects unknown operation type", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          { type: "unknown-op-type", foo: "bar" },
        ],
      }),
    ).toThrow("unsupported operation");
  });

  it("rejects unknown packId", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: "class:warlock",
            classPackId: "homebrew-pack",
            levelsGranted: 1,
            xpCost: 0,
          },
        ],
      }),
    ).toThrow("unsupported packId");
  });

  it("rejects negative xpCost", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: "class:warlock",
            classPackId: "srd-5e-2024",
            levelsGranted: 1,
            xpCost: -1,
          },
        ],
      }),
    ).toThrow("expected non-negative integer");
  });

  it("rejects zero or negative levelsGranted", () => {
    expect(() =>
      parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: "class:warlock",
            classPackId: "srd-5e-2024",
            levelsGranted: 0,
            xpCost: 0,
          },
        ],
      }),
    ).toThrow("expected positive integer");
  });

  describe("class-level operation parsing", () => {
    it("normalizes a minimal class-level operation", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: "class:fighter",
            classPackId: "srd-5e-2024",
            levelsGranted: 2,
            xpCost: 10,
          },
        ],
      });

      const op = doc.operations[0];
      expect(op.type).toBe("class-level");
      if (op.type === "class-level") {
        expect(op.classEntityId).toBe("class:fighter");
        expect(op.classPackId).toBe("srd-5e-2024");
        expect(op.levelsGranted).toBe(2);
        expect(op.xpCost).toBe(10);
        expect(op.label).toBeUndefined();
        expect(op.notes).toBeUndefined();
      }
    });

    it("preserves optional label and notes", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: "class:bard",
            classPackId: "srd-5e-2024",
            levelsGranted: 1,
            xpCost: 5,
            label: "Bard Level 3",
            notes: ["Chose College of Lore"],
          },
        ],
      });

      const op = doc.operations[0];
      if (op.type === "class-level") {
        expect(op.label).toBe("Bard Level 3");
        expect(op.notes).toEqual(["Chose College of Lore"]);
      }
    });
  });

  describe("canonical-source operation parsing", () => {
    it("normalizes a canonical-source operation", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "canonical-source",
            sourceKind: "feat",
            entityId: "feat:alert",
            packId: "srd-5e-2024",
            xpCost: 0,
          },
        ],
      });

      const op = doc.operations[0];
      expect(op.type).toBe("canonical-source");
      if (op.type === "canonical-source") {
        expect(op.sourceKind).toBe("feat");
        expect(op.entityId).toBe("feat:alert");
        expect(op.packId).toBe("srd-5e-2024");
      }
    });

    it("rejects condition sourceKind for canonical-source", () => {
      expect(() =>
        parseCharacterSpendPlanDocument({
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "condition",
              entityId: "condition:charmed",
              packId: "srd-5e-2024",
              xpCost: 0,
            },
          ],
        }),
      ).toThrow("unsupported spend-plan source kind");
    });

    it("allows optional rank and payload", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "canonical-source",
            sourceKind: "equipment",
            entityId: "equipment:leather-armor",
            packId: "srd-5e-2024",
            xpCost: 0,
            rank: 3,
            payload: { slot: "armor" },
          },
        ],
      });

      const op = doc.operations[0];
      if (op.type === "canonical-source") {
        expect(op.rank).toBe(3);
        expect(op.payload).toEqual({ slot: "armor" });
      }
    });
  });

  describe("spell-access operation parsing", () => {
    it("normalizes a spell-access operation", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "spell-access",
            spellName: "Eldritch Blast",
            sourceKind: "class-feature",
            sourceLabel: "Warlock Cantrips",
            xpCost: 0,
          },
        ],
      });

      const op = doc.operations[0];
      expect(op.type).toBe("spell-access");
      if (op.type === "spell-access") {
        expect(op.spellName).toBe("Eldritch Blast");
        expect(op.sourceKind).toBe("class-feature");
        expect(op.sourceLabel).toBe("Warlock Cantrips");
      }
    });

    it("rejects non-class-feature/aa-purchase sourceKind for spell-access", () => {
      expect(() =>
        parseCharacterSpendPlanDocument({
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "feat",
              sourceLabel: "Feat Magic",
              xpCost: 0,
            },
          ],
        }),
      ).toThrow("spell-access source kind must be class-feature or aa-purchase");
    });

    it("preserves optional spell identifiers and alwaysPrepared", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          {
            type: "spell-access",
            spellName: "Hex",
            spellEntityId: "aa-spell-hex",
            spellPackId: "advanced-adventurers",
            sourceKind: "aa-purchase",
            sourceEntityId: "aa-ability-agonizing-blast",
            sourcePackId: "advanced-adventurers",
            sourceLabel: "AA Spell Pick",
            alwaysPrepared: true,
            xpCost: 2,
          },
        ],
      });

      const op = doc.operations[0];
      if (op.type === "spell-access") {
        expect(op.spellEntityId).toBe("aa-spell-hex");
        expect(op.spellPackId).toBe("advanced-adventurers");
        expect(op.sourceEntityId).toBe("aa-ability-agonizing-blast");
        expect(op.sourcePackId).toBe("advanced-adventurers");
        expect(op.alwaysPrepared).toBe(true);
      }
    });
  });

  describe("getCharacterSpendPlanTotalXpCost", () => {
    it("sums costs across all operation types", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          { type: "class-level", classEntityId: "class:warlock", classPackId: "srd-5e-2024", levelsGranted: 1, xpCost: 5 },
          { type: "canonical-source", sourceKind: "feat", entityId: "feat:alert", packId: "srd-5e-2024", xpCost: 3 },
          { type: "spell-access", spellName: "Hex", sourceKind: "class-feature", sourceLabel: "Warlock", xpCost: 1 },
        ],
      });

      expect(getCharacterSpendPlanTotalXpCost(doc)).toBe(9);
    });

    it("returns 0 for all-free operations", () => {
      const doc = parseCharacterSpendPlanDocument({
        version: 1,
        operations: [
          { type: "class-level", classEntityId: "class:warlock", classPackId: "srd-5e-2024", levelsGranted: 1, xpCost: 0 },
        ],
      });

      expect(getCharacterSpendPlanTotalXpCost(doc)).toBe(0);
    });
  });
});
