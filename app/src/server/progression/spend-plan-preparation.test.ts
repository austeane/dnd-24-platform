import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CharacterBaseSnapshot } from "@dnd/library";
import type { CharacterSourceRecord, XpTransactionRecord } from "./types.ts";

/**
 * Mock the DB and projection layers so that prepareSpendPlan can run without
 * a real database.
 *
 * Two intercepts:
 *   1. loadCharacterProjectionRows (from projection.ts) — returns canned rows
 *   2. db (from ../db/index.ts) — provides a chainable mock for
 *      getCampaignEnabledPackIds which is a private function in
 *      spend-plan-preparation.ts that queries campaigns directly
 */

vi.mock("./projection.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./projection.ts")>();
  return {
    ...actual,
    loadCharacterProjectionRows: vi.fn(),
  };
});

vi.mock("../db/index.ts", () => {
  // Fully chainable mock that handles select().from().where().limit() etc.
  function chainable(terminal?: unknown): Record<string, unknown> {
    const proxy: Record<string, unknown> = {};
    for (const method of ["select", "from", "where", "orderBy", "limit", "offset"]) {
      proxy[method] = (..._args: unknown[]) => {
        if (method === "limit" && terminal !== undefined) return terminal;
        return proxy;
      };
    }
    // Make it thenable so Promise.all works when the chain is awaited directly
    proxy.then = (resolve: (v: unknown) => void) => resolve(terminal ?? []);
    return proxy;
  }
  const db = chainable([{ enabledPackIds: ["srd-5e-2024", "advanced-adventurers"] }]);
  return { db };
});

import { loadCharacterProjectionRows } from "./projection.ts";
import { prepareSpendPlan } from "./spend-plan-preparation.ts";
import type { CharacterProjectionRows } from "./projection.ts";

const mockLoadRows = vi.mocked(loadCharacterProjectionRows);

// --- fixtures ---

const now = new Date("2026-03-10T00:00:00.000Z");

function makeProjectionRows(
  sourceRecords: CharacterSourceRecord[],
  xpRecords: XpTransactionRecord[] = [],
): CharacterProjectionRows {
  return {
    sourceRecords,
    xpRecords,
    hitPointRecord: null,
    activeConditionRecords: [],
    resourcePoolRecords: [],
    skillChoiceRecords: [],
    featChoiceRecords: [],
    equipmentRecords: [],
    weaponMasteryRecords: [],
    metamagicChoiceRecords: [],
    activePactBladeBond: null,
  };
}

const baseSnapshot: CharacterBaseSnapshot = {
  name: "TestChar",
  progressionMode: "hybrid",
  abilityScores: {
    strength: 10,
    dexterity: 14,
    constitution: 12,
    intelligence: 10,
    wisdom: 13,
    charisma: 16,
  },
  baseArmorClass: 12,
  baseMaxHP: 10,
  baseSpeed: 30,
  spellcastingAbility: "charisma",
};

function makeOverrideSource(): CharacterSourceRecord {
  return {
    id: "source-override",
    characterId: "char-1",
    sourceKind: "override",
    sourceEntityId: "base-snapshot",
    sourcePackId: null,
    label: "Character Sheet Import",
    rank: 1,
    payloadJson: { baseSnapshot },
    suppressedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeClassLevelSource(classId: string, packId: string, rank: number): CharacterSourceRecord {
  return {
    id: `source-class-${classId}-${rank}`,
    characterId: "char-1",
    sourceKind: "class-level",
    sourceEntityId: classId,
    sourcePackId: packId,
    label: `Warlock +1`,
    rank,
    payloadJson: { description: "Class level advancement.", levelsGranted: 1 },
    suppressedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeXpAward(amount: number): XpTransactionRecord {
  return {
    id: `xp-award-${amount}`,
    campaignId: "campaign-1",
    characterId: "char-1",
    sessionId: null,
    category: "award",
    amount,
    note: `Awarded ${amount} XP`,
    createdByLabel: "DM",
    createdAt: now,
  };
}

// --- tests ---

describe("prepareSpendPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("spend-plan preview (progression-spend-plan-preview)", () => {
    it("returns a valid preview for a class-level operation", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "preview:char-1",
        "campaign-1",
        "char-1",
        null,
        "preview",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        },
      );

      expect(result.publicPreview.totalXpCost).toBe(5);
      expect(result.publicPreview.bankedXpBefore).toBe(20);
      expect(result.publicPreview.bankedXpAfter).toBe(15);
      expect(result.publicPreview.normalizedOperationCount).toBe(1);
      expect(result.operations).toHaveLength(1);
      expect(result.document.version).toBe(1);
    });

    it("correctly prices multi-operation plans", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(30)]));

      const result = await prepareSpendPlan(
        "preview:char-1",
        "campaign-1",
        "char-1",
        null,
        "preview",
        {
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
              entityId: "feat:alert",
              packId: "srd-5e-2024",
              xpCost: 3,
            },
          ],
        },
      );

      expect(result.publicPreview.totalXpCost).toBe(8);
      expect(result.publicPreview.bankedXpBefore).toBe(30);
      expect(result.publicPreview.bankedXpAfter).toBe(22);
      expect(result.operations).toHaveLength(2);
    });

    it("rejects preview when character has no base snapshot", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([]));

      await expect(
        prepareSpendPlan("preview:char-1", "campaign-1", "char-1", null, "preview", {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 0,
            },
          ],
        }),
      ).rejects.toThrow("has no base snapshot");
    });

    it("rejects operations when XP is insufficient", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(3)]));

      await expect(
        prepareSpendPlan("preview:char-1", "campaign-1", "char-1", null, "preview", {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        }),
      ).rejects.toThrow("costs 5 XP but only 3 XP is currently banked");
    });

    it("allows zero-cost operations with no banked XP", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "preview:char-1",
        "campaign-1",
        "char-1",
        null,
        "preview",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 0,
            },
          ],
        },
      );

      expect(result.publicPreview.totalXpCost).toBe(0);
      expect(result.publicPreview.bankedXpBefore).toBe(0);
      expect(result.publicPreview.bankedXpAfter).toBe(0);
    });

    it("tracks XP budget across sequential operations in a single plan", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(10)]));

      await expect(
        prepareSpendPlan("preview:char-1", "campaign-1", "char-1", null, "preview", {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 6,
            },
            {
              type: "class-level",
              classEntityId: "class:fighter",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        }),
      ).rejects.toThrow("costs 5 XP but only 4 XP is currently banked");
    });
  });

  describe("class-level commit (progression-class-level-commit)", () => {
    it("produces correct source insert for class-level operation", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        "session-1",
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op).toBeDefined();
      expect(op.sourceInsert.characterId).toBe("char-1");
      expect(op.sourceInsert.sourceKind).toBe("class-level");
      expect(op.sourceInsert.sourceEntityId).toBe("class:warlock");
      expect(op.sourceInsert.sourcePackId).toBe("srd-5e-2024");
      expect(op.sourceInsert.rank).toBe(1);
      expect(op.sourceInsert.id).toBe("plan-1:source:0");
    });

    it("produces correct XP transaction insert for non-zero cost", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        "session-1",
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op.xpInsert).not.toBeNull();
      expect(op.xpInsert!.campaignId).toBe("campaign-1");
      expect(op.xpInsert!.characterId).toBe("char-1");
      expect(op.xpInsert!.sessionId).toBe("session-1");
      expect(op.xpInsert!.category).toBe("spend-level");
      expect(op.xpInsert!.amount).toBe(5);
      expect(op.xpInsert!.createdByLabel).toBe("DM");
    });

    it("omits XP transaction for zero-cost class-level operation", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 0,
            },
          ],
        },
      );

      expect(result.operations[0].xpInsert).toBeNull();
    });

    it("assigns incrementing ranks for same-class level-ups", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([
        makeOverrideSource(),
        makeClassLevelSource("class:warlock", "srd-5e-2024", 1),
      ], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 5,
            },
          ],
        },
      );

      expect(result.operations[0].sourceInsert.rank).toBe(2);
    });

    it("assigns incrementing ranks for multiple class-level ops in same plan", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 3,
            },
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 3,
            },
          ],
        },
      );

      expect(result.operations[0].sourceInsert.rank).toBe(1);
      expect(result.operations[1].sourceInsert.rank).toBe(2);
    });

    it("rejects unknown class entity", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      await expect(
        prepareSpendPlan("plan-1", "campaign-1", "char-1", null, "DM", {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:nonexistent",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 0,
            },
          ],
        }),
      ).rejects.toThrow("unknown class");
    });

    it("uses custom label when provided", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "class-level",
              classEntityId: "class:warlock",
              classPackId: "srd-5e-2024",
              levelsGranted: 1,
              xpCost: 0,
              label: "Pact of the Blade Warlock",
            },
          ],
        },
      );

      expect(result.operations[0].sourceInsert.label).toBe("Pact of the Blade Warlock");
    });
  });

  describe("canonical-source commit (progression-canonical-source-commit)", () => {
    it("produces correct source insert for a feat", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "feat",
              entityId: "feat:alert",
              packId: "srd-5e-2024",
              xpCost: 2,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op.sourceInsert.sourceKind).toBe("feat");
      expect(op.sourceInsert.sourceEntityId).toBe("feat:alert");
      expect(op.sourceInsert.sourcePackId).toBe("srd-5e-2024");
      expect(op.sourceInsert.label).toBe("Alert");
      expect(op.xpInsert).not.toBeNull();
      expect(op.xpInsert!.category).toBe("spend-level");
      expect(op.xpInsert!.amount).toBe(2);
    });

    it("produces correct source insert for a species", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "species",
              entityId: "species:drow",
              packId: "srd-5e-2024",
              xpCost: 0,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op.sourceInsert.sourceKind).toBe("species");
      expect(op.sourceInsert.sourceEntityId).toBe("species:drow");
      expect(op.sourceInsert.label).toBe("Drow");
      expect(op.xpInsert).toBeNull();
    });

    it("rejects duplicate non-repeatable feat", async () => {
      const existingFeatSource: CharacterSourceRecord = {
        id: "source-feat-alert",
        characterId: "char-1",
        sourceKind: "feat",
        sourceEntityId: "feat:alert",
        sourcePackId: "srd-5e-2024",
        label: "Alert",
        rank: 1,
        payloadJson: null,
        suppressedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource(), existingFeatSource], [makeXpAward(20)]));

      await expect(
        prepareSpendPlan("plan-1", "campaign-1", "char-1", null, "DM", {
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
        }),
      ).rejects.toThrow("already present on this character");
    });

    it("rejects unknown canonical entity", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      await expect(
        prepareSpendPlan("plan-1", "campaign-1", "char-1", null, "DM", {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "feat",
              entityId: "feat:nonexistent-feat",
              packId: "srd-5e-2024",
              xpCost: 0,
            },
          ],
        }),
      ).rejects.toThrow("unknown source");
    });

    it("rejects sourceKind-type mismatch", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      await expect(
        prepareSpendPlan("plan-1", "campaign-1", "char-1", null, "DM", {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "species",
              entityId: "feat:alert",
              packId: "srd-5e-2024",
              xpCost: 0,
            },
          ],
        }),
      ).rejects.toThrow("cannot point at");
    });

    it("uses aa-purchase XP category for aa-purchase sourceKind", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(20)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "aa-purchase",
              entityId: "aa-ability-action-surge",
              packId: "advanced-adventurers",
              xpCost: 4,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op.xpInsert).not.toBeNull();
      expect(op.xpInsert!.category).toBe("spend-aa");
    });

    it("respects custom rank when provided", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "canonical-source",
              sourceKind: "species",
              entityId: "species:drow",
              packId: "srd-5e-2024",
              xpCost: 0,
              rank: 5,
            },
          ],
        },
      );

      expect(result.operations[0].sourceInsert.rank).toBe(5);
    });
  });

  describe("spell-access commit (progression-spell-access-commit)", () => {
    it("produces correct source insert for spell-access by name", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(10)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "class-feature",
              sourceLabel: "Warlock Spells Known",
              xpCost: 0,
            },
          ],
        },
      );

      const op = result.operations[0];
      expect(op.sourceInsert.characterId).toBe("char-1");
      expect(op.sourceInsert.sourceKind).toBe("class-feature");
      expect(op.sourceInsert.label).toBe("Warlock Spells Known");

      const payload = op.sourceInsert.payloadJson as Record<string, unknown>;
      expect(payload.effects).toBeDefined();
      const effects = payload.effects as Array<Record<string, unknown>>;
      expect(effects[0].type).toBe("grant-spell-access");
    });

    it("rejects unknown spell name", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(10)]));

      await expect(
        prepareSpendPlan("plan-1", "campaign-1", "char-1", null, "DM", {
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Nonexistent Spell That Does Not Exist",
              sourceKind: "class-feature",
              sourceLabel: "Warlock Spells",
              xpCost: 0,
            },
          ],
        }),
      ).rejects.toThrow("unknown spell");
    });

    it("tracks alwaysPrepared flag in spell access payload", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "class-feature",
              sourceLabel: "Warlock Spells Known",
              alwaysPrepared: true,
              xpCost: 0,
            },
          ],
        },
      );

      const payload = result.operations[0].sourceInsert.payloadJson as Record<string, unknown>;
      const effects = payload.effects as Array<{ type: string; spell: { alwaysPrepared: boolean } }>;
      expect(effects[0].spell.alwaysPrepared).toBe(true);
    });

    it("uses aa-purchase XP category for aa-purchase spell access", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(10)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "aa-purchase",
              sourceLabel: "AA Spell Pick",
              xpCost: 3,
            },
          ],
        },
      );

      expect(result.operations[0].xpInsert!.category).toBe("spend-aa");
    });

    it("omits XP transaction for zero-cost spell access", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        null,
        "DM",
        {
          version: 1,
          operations: [
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "class-feature",
              sourceLabel: "Warlock Spells Known",
              xpCost: 0,
            },
          ],
        },
      );

      expect(result.operations[0].xpInsert).toBeNull();
    });
  });

  describe("mixed operation plans", () => {
    it("handles plan with class-level + feat + spell-access in sequence", async () => {
      mockLoadRows.mockResolvedValue(makeProjectionRows([makeOverrideSource()], [makeXpAward(30)]));

      const result = await prepareSpendPlan(
        "plan-1",
        "campaign-1",
        "char-1",
        "session-1",
        "DM",
        {
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
              entityId: "feat:alert",
              packId: "srd-5e-2024",
              xpCost: 2,
            },
            {
              type: "spell-access",
              spellName: "Hex",
              sourceKind: "class-feature",
              sourceLabel: "Warlock Spells Known",
              xpCost: 0,
            },
          ],
        },
      );

      expect(result.operations).toHaveLength(3);
      expect(result.publicPreview.totalXpCost).toBe(7);
      expect(result.publicPreview.bankedXpBefore).toBe(30);
      expect(result.publicPreview.bankedXpAfter).toBe(23);

      const sourceIds = result.operations.map((op) => op.sourceInsert.id);
      expect(new Set(sourceIds).size).toBe(3);
    });
  });
});
