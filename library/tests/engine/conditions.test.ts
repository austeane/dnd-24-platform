import { describe, expect, it } from "vitest";
import {
  ALL_CONDITION_NAMES,
  canAttackTarget,
  canTakeActions,
  canTakeReactions,
  computeCharacterState,
  computeConditionEffects,
  getActiveConditionTags,
} from "../../src/index.ts";
import type {
  ActiveCondition,
  CharacterComputationInput,
} from "../../src/types/character.ts";

// --- Fixtures ---

const baseCharmed: ActiveCondition = {
  conditionName: "charmed",
  appliedAt: "2026-03-10T12:00:00.000Z",
  appliedByLabel: "DM",
  sourceCreature: "Vampire Lord",
};

const baseIncapacitated: ActiveCondition = {
  conditionName: "incapacitated",
  appliedAt: "2026-03-10T12:00:00.000Z",
  appliedByLabel: "DM",
};

const sampleInput: CharacterComputationInput = {
  base: {
    name: "Ronan Wildspark",
    progressionMode: "hybrid",
    abilityScores: {
      strength: 13,
      dexterity: 17,
      constitution: 15,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    baseArmorClass: 14,
    baseMaxHP: 22,
    baseSpeed: 30,
  },
  sources: [
    {
      source: {
        id: "class-level-fighter",
        kind: "class-level",
        name: "Fighter 2",
        rank: 2,
      },
      effects: [
        {
          type: "grant-resource",
          resource: { name: "Second Wind", maxUses: 1, resetOn: "short" },
        },
        {
          type: "grant-action",
          action: {
            name: "Second Wind",
            timing: "bonus-action",
            description: "Regain HP equal to 1d10 + fighter level.",
          },
        },
      ],
    },
  ],
  xpLedger: [],
};

// --- Tests ---

describe("ALL_CONDITION_NAMES", () => {
  it("lists charmed and incapacitated", () => {
    expect(ALL_CONDITION_NAMES).toContain("charmed");
    expect(ALL_CONDITION_NAMES).toContain("incapacitated");
    expect(ALL_CONDITION_NAMES).toHaveLength(2);
  });
});

describe("computeConditionEffects", () => {
  it("returns empty array for no conditions", () => {
    const effects = computeConditionEffects([]);
    expect(effects).toEqual([]);
  });

  describe("Charmed", () => {
    it("produces attack and social disadvantage effects", () => {
      const effects = computeConditionEffects([baseCharmed]);

      expect(effects).toHaveLength(2);

      const attackRestriction = effects.find((e) =>
        e.tags.includes("attack-restriction"),
      );
      expect(attackRestriction).toBeDefined();
      expect(attackRestriction!.conditionName).toBe("charmed");
      expect(attackRestriction!.description).toContain("Vampire Lord");
      expect(attackRestriction!.tags).toContain("targeting-restriction");

      const socialEffect = effects.find((e) =>
        e.tags.includes("social"),
      );
      expect(socialEffect).toBeDefined();
      expect(socialEffect!.description).toContain("advantage");
      expect(socialEffect!.description).toContain("Vampire Lord");
    });

    it("uses 'the charmer' when no sourceCreature is specified", () => {
      const charmedNoSource: ActiveCondition = {
        ...baseCharmed,
        sourceCreature: undefined,
      };
      const effects = computeConditionEffects([charmedNoSource]);

      expect(effects[0]!.description).toContain("the charmer");
      expect(effects[1]!.description).toContain("the charmer");
    });
  });

  describe("Incapacitated", () => {
    it("produces action restriction and concentration broken effects", () => {
      const effects = computeConditionEffects([baseIncapacitated]);

      expect(effects).toHaveLength(2);

      const actionRestriction = effects.find((e) =>
        e.tags.includes("action-restriction"),
      );
      expect(actionRestriction).toBeDefined();
      expect(actionRestriction!.conditionName).toBe("incapacitated");
      expect(actionRestriction!.description).toContain("actions");
      expect(actionRestriction!.tags).toContain("bonus-action-restriction");
      expect(actionRestriction!.tags).toContain("reaction-restriction");

      const concentrationEffect = effects.find((e) =>
        e.tags.includes("concentration-broken"),
      );
      expect(concentrationEffect).toBeDefined();
      expect(concentrationEffect!.description).toContain("Concentration");
    });
  });

  it("accumulates effects from multiple conditions", () => {
    const effects = computeConditionEffects([baseCharmed, baseIncapacitated]);

    expect(effects).toHaveLength(4);
    const charmedEffects = effects.filter((e) => e.conditionName === "charmed");
    const incapEffects = effects.filter((e) => e.conditionName === "incapacitated");
    expect(charmedEffects).toHaveLength(2);
    expect(incapEffects).toHaveLength(2);
  });
});

describe("canTakeActions", () => {
  it("returns true with no conditions", () => {
    expect(canTakeActions([])).toBe(true);
  });

  it("returns true when only charmed", () => {
    expect(canTakeActions([baseCharmed])).toBe(true);
  });

  it("returns false when incapacitated", () => {
    expect(canTakeActions([baseIncapacitated])).toBe(false);
  });

  it("returns false when both charmed and incapacitated", () => {
    expect(canTakeActions([baseCharmed, baseIncapacitated])).toBe(false);
  });
});

describe("canTakeReactions", () => {
  it("returns true with no conditions", () => {
    expect(canTakeReactions([])).toBe(true);
  });

  it("returns true when only charmed", () => {
    expect(canTakeReactions([baseCharmed])).toBe(true);
  });

  it("returns false when incapacitated", () => {
    expect(canTakeReactions([baseIncapacitated])).toBe(false);
  });
});

describe("canAttackTarget", () => {
  it("returns true with no conditions", () => {
    expect(canAttackTarget([], "Goblin")).toBe(true);
  });

  it("returns true when attacking a non-charmer", () => {
    expect(canAttackTarget([baseCharmed], "Goblin")).toBe(true);
  });

  it("returns false when attacking the charmer", () => {
    expect(canAttackTarget([baseCharmed], "Vampire Lord")).toBe(false);
  });

  it("returns true when charmed but no sourceCreature specified", () => {
    const charmedNoSource: ActiveCondition = {
      ...baseCharmed,
      sourceCreature: undefined,
    };
    expect(canAttackTarget([charmedNoSource], "Anyone")).toBe(true);
  });
});

describe("getActiveConditionTags", () => {
  it("returns empty for no conditions", () => {
    expect(getActiveConditionTags([])).toEqual([]);
  });

  it("returns sorted unique tags for charmed", () => {
    const tags = getActiveConditionTags([baseCharmed]);
    expect(tags).toEqual([
      "attack-restriction",
      "disadvantage-ability-check",
      "social",
      "targeting-restriction",
    ]);
  });

  it("returns sorted unique tags for incapacitated", () => {
    const tags = getActiveConditionTags([baseIncapacitated]);
    expect(tags).toEqual([
      "action-restriction",
      "bonus-action-restriction",
      "concentration-broken",
      "reaction-restriction",
    ]);
  });

  it("deduplicates across multiple conditions", () => {
    const tags = getActiveConditionTags([baseCharmed, baseIncapacitated]);
    const uniqueTags = [...new Set(tags)];
    expect(tags).toEqual(uniqueTags);
  });
});

describe("computeCharacterState with conditions", () => {
  it("includes empty conditions when no activeConditions provided", () => {
    const state = computeCharacterState(sampleInput);

    expect(state.conditions).toBeDefined();
    expect(state.conditions.active).toEqual([]);
    expect(state.conditions.effects).toEqual([]);
  });

  it("computes condition effects from activeConditions input", () => {
    const inputWithConditions: CharacterComputationInput = {
      ...sampleInput,
      activeConditions: [baseCharmed, baseIncapacitated],
    };

    const state = computeCharacterState(inputWithConditions);

    expect(state.conditions.active).toHaveLength(2);
    expect(state.conditions.effects).toHaveLength(4);
    expect(state.conditions.active[0]!.conditionName).toBe("charmed");
    expect(state.conditions.active[1]!.conditionName).toBe("incapacitated");
  });

  it("preserves DM audit fields in active conditions", () => {
    const inputWithConditions: CharacterComputationInput = {
      ...sampleInput,
      activeConditions: [baseCharmed],
    };

    const state = computeCharacterState(inputWithConditions);

    const active = state.conditions.active[0]!;
    expect(active.appliedByLabel).toBe("DM");
    expect(active.appliedAt).toBe("2026-03-10T12:00:00.000Z");
    expect(active.sourceCreature).toBe("Vampire Lord");
  });
});
