import { describe, expect, it } from "vitest";
import {
  buildSpellSlotPoolDefinitions,
  computeCharacterState,
  computePreparedSpellCapacity,
  derivePactMagicSlots,
  deriveStandardSlots,
  getCantripCount,
  getCasterType,
  getKnownSpellCount,
  getSpellLearningMode,
  FULL_CASTER_SLOT_TABLE,
  HALF_CASTER_SLOT_TABLE,
  PACT_MAGIC_TABLE,
} from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

// ---------------------------------------------------------------------------
// Helpers: build CharacterComputationInput for caster characters
// ---------------------------------------------------------------------------

function makeCasterInput(overrides: {
  name: string;
  classId: string;
  level: number;
  spellcastingAbility: "wisdom" | "charisma" | "intelligence";
  abilityScores: CharacterComputationInput["base"]["abilityScores"];
  slotEffects?: Array<{ slots: number[]; resetOn: "short" | "long"; source: string }>;
  capacityEffects?: Array<{ kind: "cantrips" | "prepared-spells" | "known-spells"; count: number }>;
  spellAccess?: Array<{ spellName: string; alwaysPrepared: boolean; source: string }>;
}): CharacterComputationInput {
  const effects: import("../../src/types/effect.ts").Effect[] = [];

  for (const slotPool of overrides.slotEffects ?? []) {
    effects.push({
      type: "grant-spell-slots",
      pool: slotPool,
    });
  }

  for (const cap of overrides.capacityEffects ?? []) {
    effects.push({
      type: "grant-spell-capacity",
      capacity: cap,
    });
  }

  for (const spell of overrides.spellAccess ?? []) {
    effects.push({
      type: "grant-spell-access",
      spell,
    });
  }

  return {
    base: {
      name: overrides.name,
      progressionMode: "hybrid",
      abilityScores: overrides.abilityScores,
      baseArmorClass: 10,
      baseMaxHP: 10,
      baseSpeed: 30,
      spellcastingAbility: overrides.spellcastingAbility,
    },
    sources: [
      {
        source: {
          id: `class-level-${overrides.classId}`,
          kind: "class-level",
          name: `${overrides.classId} ${overrides.level}`,
          rank: overrides.level,
        },
        effects,
      },
    ],
    xpLedger: [],
  };
}

// ---------------------------------------------------------------------------
// Caster type classification
// ---------------------------------------------------------------------------

describe("getCasterType", () => {
  it("identifies full casters", () => {
    expect(getCasterType("bard")).toBe("full");
    expect(getCasterType("cleric")).toBe("full");
    expect(getCasterType("druid")).toBe("full");
    expect(getCasterType("sorcerer")).toBe("full");
    expect(getCasterType("wizard")).toBe("full");
  });

  it("identifies half casters", () => {
    expect(getCasterType("paladin")).toBe("half");
    expect(getCasterType("ranger")).toBe("half");
  });

  it("identifies pact caster", () => {
    expect(getCasterType("warlock")).toBe("pact");
  });

  it("identifies non-casters", () => {
    expect(getCasterType("fighter")).toBe("none");
    expect(getCasterType("barbarian")).toBe("none");
    expect(getCasterType("monk")).toBe("none");
    expect(getCasterType("rogue")).toBe("none");
  });

  it("handles prefixed class IDs", () => {
    expect(getCasterType("class-bard")).toBe("full");
    expect(getCasterType("class:warlock")).toBe("pact");
    expect(getCasterType("class-fighter")).toBe("none");
  });

  it("returns none for unknown classes", () => {
    expect(getCasterType("artificer")).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// Spell learning mode
// ---------------------------------------------------------------------------

describe("getSpellLearningMode", () => {
  it("identifies prepared casters", () => {
    expect(getSpellLearningMode("cleric")).toBe("prepared");
    expect(getSpellLearningMode("druid")).toBe("prepared");
    expect(getSpellLearningMode("paladin")).toBe("prepared");
    expect(getSpellLearningMode("wizard")).toBe("prepared");
  });

  it("identifies known-spell casters", () => {
    expect(getSpellLearningMode("bard")).toBe("known");
    expect(getSpellLearningMode("sorcerer")).toBe("known");
    expect(getSpellLearningMode("ranger")).toBe("known");
    expect(getSpellLearningMode("warlock")).toBe("known");
  });

  it("returns null for non-casters", () => {
    expect(getSpellLearningMode("fighter")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Standard slot progression (full casters)
// ---------------------------------------------------------------------------

describe("deriveStandardSlots", () => {
  it("returns correct slots for a level 2 druid (Tali)", () => {
    const slots = deriveStandardSlots("druid", 2);
    expect(slots).toEqual([3]);
  });

  it("returns correct slots for a level 2 bard (Vivennah)", () => {
    const slots = deriveStandardSlots("bard", 2);
    expect(slots).toEqual([3]);
  });

  it("returns correct slots for a level 2 sorcerer (Nara)", () => {
    const slots = deriveStandardSlots("sorcerer", 2);
    expect(slots).toEqual([3]);
  });

  it("returns correct slots at level 5 (full caster gets 3rd level slots)", () => {
    const slots = deriveStandardSlots("druid", 5);
    expect(slots).toEqual([4, 3, 2]);
  });

  it("returns correct slots at level 20", () => {
    const slots = deriveStandardSlots("wizard", 20);
    expect(slots).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });

  it("returns correct half-caster slots for level 2 paladin", () => {
    const slots = deriveStandardSlots("paladin", 2);
    expect(slots).toEqual([2]);
  });

  it("returns empty for level 1 half-caster (no slots yet)", () => {
    const slots = deriveStandardSlots("ranger", 1);
    expect(slots).toEqual([]);
  });

  it("returns empty for warlock (uses Pact Magic)", () => {
    const slots = deriveStandardSlots("warlock", 5);
    expect(slots).toEqual([]);
  });

  it("returns empty for non-casters", () => {
    const slots = deriveStandardSlots("fighter", 5);
    expect(slots).toEqual([]);
  });

  it("clamps level to valid range", () => {
    const slotsLow = deriveStandardSlots("bard", 0);
    expect(slotsLow).toEqual([2]); // Clamped to level 1

    const slotsHigh = deriveStandardSlots("bard", 25);
    expect(slotsHigh).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]); // Clamped to 20
  });
});

// ---------------------------------------------------------------------------
// Pact Magic slot progression (Warlock)
// ---------------------------------------------------------------------------

describe("derivePactMagicSlots", () => {
  it("returns correct pact slots for level 1 warlock", () => {
    const result = derivePactMagicSlots(1);
    expect(result).toEqual({ count: 1, maxLevel: 1 });
  });

  it("returns correct pact slots for level 2 warlock (Oriana)", () => {
    const result = derivePactMagicSlots(2);
    expect(result).toEqual({ count: 2, maxLevel: 1 });
  });

  it("returns correct pact slots for level 5 warlock", () => {
    const result = derivePactMagicSlots(5);
    expect(result).toEqual({ count: 2, maxLevel: 3 });
  });

  it("returns correct pact slots for level 11 warlock (3 slots)", () => {
    const result = derivePactMagicSlots(11);
    expect(result).toEqual({ count: 3, maxLevel: 5 });
  });

  it("returns correct pact slots for level 17 warlock (4 slots)", () => {
    const result = derivePactMagicSlots(17);
    expect(result).toEqual({ count: 4, maxLevel: 5 });
  });

  it("clamps level to valid range", () => {
    expect(derivePactMagicSlots(0)).toEqual({ count: 1, maxLevel: 1 });
    expect(derivePactMagicSlots(25)).toEqual({ count: 4, maxLevel: 5 });
  });
});

// ---------------------------------------------------------------------------
// Known / prepared spell capacity
// ---------------------------------------------------------------------------

describe("computePreparedSpellCapacity", () => {
  it("computes prepared capacity for druid (Tali): level 2, WIS +3", () => {
    // Tali: Druid 2, Wisdom 17 (+3), so 2 + 3 = 5 prepared
    const capacity = computePreparedSpellCapacity(2, 3);
    expect(capacity).toBe(5);
  });

  it("enforces minimum of 1", () => {
    const capacity = computePreparedSpellCapacity(1, -3);
    expect(capacity).toBe(1);
  });

  it("scales with level", () => {
    const capacity = computePreparedSpellCapacity(10, 5);
    expect(capacity).toBe(15);
  });
});

describe("getKnownSpellCount", () => {
  it("returns correct known spells for bard level 2 (Vivennah)", () => {
    const count = getKnownSpellCount("bard", 2);
    expect(count).toBe(5);
  });

  it("returns correct known spells for sorcerer level 2 (Nara)", () => {
    const count = getKnownSpellCount("sorcerer", 2);
    expect(count).toBe(4);
  });

  it("returns correct known spells for warlock level 2 (Oriana)", () => {
    const count = getKnownSpellCount("warlock", 2);
    expect(count).toBe(3);
  });

  it("returns null for prepared casters", () => {
    expect(getKnownSpellCount("cleric", 5)).toBeNull();
    expect(getKnownSpellCount("druid", 5)).toBeNull();
  });

  it("returns null for non-casters", () => {
    expect(getKnownSpellCount("fighter", 5)).toBeNull();
  });

  it("scales with level", () => {
    expect(getKnownSpellCount("bard", 10)).toBe(14);
    expect(getKnownSpellCount("sorcerer", 20)).toBe(19);
    expect(getKnownSpellCount("warlock", 17)).toBe(14);
  });
});

describe("getCantripCount", () => {
  it("returns cantrip count for full casters", () => {
    expect(getCantripCount("bard", 1)).toBe(2);
    expect(getCantripCount("druid", 4)).toBe(3);
    expect(getCantripCount("sorcerer", 10)).toBe(4);
  });

  it("returns cantrip count for warlock", () => {
    expect(getCantripCount("warlock", 1)).toBe(2);
    expect(getCantripCount("warlock", 4)).toBe(3);
    expect(getCantripCount("warlock", 10)).toBe(4);
  });

  it("returns null for non-casters", () => {
    expect(getCantripCount("fighter", 5)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Progression table integrity
// ---------------------------------------------------------------------------

describe("progression table integrity", () => {
  it("full caster table has 20 entries", () => {
    expect(FULL_CASTER_SLOT_TABLE).toHaveLength(20);
  });

  it("half caster table has 20 entries", () => {
    expect(HALF_CASTER_SLOT_TABLE).toHaveLength(20);
  });

  it("pact magic table has 20 entries", () => {
    expect(PACT_MAGIC_TABLE).toHaveLength(20);
  });

  it("full caster slots never decrease as level increases", () => {
    for (let level = 1; level < 20; level++) {
      const current = FULL_CASTER_SLOT_TABLE[level - 1]!;
      const next = FULL_CASTER_SLOT_TABLE[level]!;
      for (let spellLevel = 0; spellLevel < current.length; spellLevel++) {
        expect(next[spellLevel]!).toBeGreaterThanOrEqual(current[spellLevel]!);
      }
    }
  });

  it("half caster slots never decrease as level increases", () => {
    for (let level = 1; level < 20; level++) {
      const current = HALF_CASTER_SLOT_TABLE[level - 1]!;
      const next = HALF_CASTER_SLOT_TABLE[level]!;
      for (let spellLevel = 0; spellLevel < current.length; spellLevel++) {
        expect(next[spellLevel]!).toBeGreaterThanOrEqual(current[spellLevel]!);
      }
    }
  });

  it("pact magic slot count never decreases", () => {
    for (let level = 1; level < 20; level++) {
      expect(PACT_MAGIC_TABLE[level]!.count).toBeGreaterThanOrEqual(
        PACT_MAGIC_TABLE[level - 1]!.count,
      );
    }
  });

  it("pact magic max level never decreases", () => {
    for (let level = 1; level < 20; level++) {
      expect(PACT_MAGIC_TABLE[level]!.maxLevel).toBeGreaterThanOrEqual(
        PACT_MAGIC_TABLE[level - 1]!.maxLevel,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// buildSpellSlotPoolDefinitions
// ---------------------------------------------------------------------------

describe("buildSpellSlotPoolDefinitions", () => {
  it("converts standard slot pools to resource pool definitions", () => {
    const definitions = buildSpellSlotPoolDefinitions([
      {
        sourceName: "Bard 2 Spellcasting",
        source: "Spellcasting",
        resetOn: "long",
        slots: [
          { level: 1, total: 3, current: 3 },
        ],
      },
    ]);

    expect(definitions).toEqual([
      {
        slotLevel: 1,
        total: 3,
        resetOn: "long",
        source: "Spellcasting",
        resourceName: "Spell Slot (Level 1)",
      },
    ]);
  });

  it("converts pact magic pools with correct naming", () => {
    const definitions = buildSpellSlotPoolDefinitions([
      {
        sourceName: "Warlock 2 Pact Magic",
        source: "Pact Magic",
        resetOn: "short",
        slots: [
          { level: 1, total: 2, current: 2 },
        ],
      },
    ]);

    expect(definitions).toEqual([
      {
        slotLevel: 1,
        total: 2,
        resetOn: "short",
        source: "Pact Magic",
        resourceName: "Pact Magic Slot (Level 1)",
      },
    ]);
  });

  it("handles multi-level slot pools", () => {
    const definitions = buildSpellSlotPoolDefinitions([
      {
        sourceName: "Druid 5 Spellcasting",
        source: "Spellcasting",
        resetOn: "long",
        slots: [
          { level: 1, total: 4, current: 4 },
          { level: 2, total: 3, current: 3 },
          { level: 3, total: 2, current: 2 },
        ],
      },
    ]);

    expect(definitions).toHaveLength(3);
    expect(definitions[0]!.resourceName).toBe("Spell Slot (Level 1)");
    expect(definitions[0]!.total).toBe(4);
    expect(definitions[1]!.resourceName).toBe("Spell Slot (Level 2)");
    expect(definitions[1]!.total).toBe(3);
    expect(definitions[2]!.resourceName).toBe("Spell Slot (Level 3)");
    expect(definitions[2]!.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Integration: live roster characters through computeCharacterState
// ---------------------------------------------------------------------------

describe("live roster spellcasting integration", () => {
  it("Tali (Druid 2): standard slots, WIS-based spellcasting", () => {
    const input = makeCasterInput({
      name: "Tali",
      classId: "druid",
      level: 2,
      spellcastingAbility: "wisdom",
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 14,
        intelligence: 14,
        wisdom: 17,
        charisma: 10,
      },
      slotEffects: [{ slots: [3], resetOn: "long", source: "Spellcasting" }],
      spellAccess: [
        { spellName: "Shillelagh", alwaysPrepared: false, source: "Druid" },
        { spellName: "Druidcraft", alwaysPrepared: false, source: "Druid" },
        { spellName: "Cure Wounds", alwaysPrepared: false, source: "Druid" },
      ],
    });

    const state = computeCharacterState(input);

    expect(state.spellcasting).not.toBeNull();
    const sc = state.spellcasting!;
    expect(sc.ability).toBe("wisdom");
    expect(sc.spellSaveDc).toBe(13); // 8 + 2 (prof) + 3 (WIS)
    expect(sc.spellAttackBonus).toBe(5); // 2 (prof) + 3 (WIS)
    expect(sc.slotPools).toHaveLength(1);
    expect(sc.slotPools[0]!.source).toBe("Spellcasting");
    expect(sc.slotPools[0]!.resetOn).toBe("long");
    expect(sc.slotPools[0]!.slots).toEqual([{ level: 1, total: 3, current: 3 }]);
    expect(sc.grantedSpellNames).toContain("Cure Wounds");
    expect(sc.grantedSpellNames).toContain("Druidcraft");
    expect(sc.grantedSpellNames).toContain("Shillelagh");

    // Verify derived capacity
    const preparedCapacity = computePreparedSpellCapacity(2, 3); // level + WIS mod
    expect(preparedCapacity).toBe(5);
  });

  it("Vivennah (Bard 2): standard slots, CHA-based spellcasting, known spells", () => {
    const input = makeCasterInput({
      name: "Vivennah",
      classId: "bard",
      level: 2,
      spellcastingAbility: "charisma",
      abilityScores: {
        strength: 8,
        dexterity: 18,
        constitution: 14,
        intelligence: 12,
        wisdom: 10,
        charisma: 17,
      },
      slotEffects: [{ slots: [3], resetOn: "long", source: "Spellcasting" }],
      spellAccess: [
        { spellName: "Faerie Fire", alwaysPrepared: false, source: "Bard" },
        { spellName: "Thunderwave", alwaysPrepared: false, source: "Bard" },
        { spellName: "Vicious Mockery", alwaysPrepared: false, source: "Bard" },
      ],
    });

    const state = computeCharacterState(input);

    expect(state.spellcasting).not.toBeNull();
    const sc = state.spellcasting!;
    expect(sc.ability).toBe("charisma");
    expect(sc.spellSaveDc).toBe(13);
    expect(sc.spellAttackBonus).toBe(5);
    expect(sc.slotPools).toHaveLength(1);
    expect(sc.slotPools[0]!.slots).toEqual([{ level: 1, total: 3, current: 3 }]);

    // Bard known spell count at level 2
    const knownCount = getKnownSpellCount("bard", 2);
    expect(knownCount).toBe(5);
  });

  it("Nara (Sorcerer 2): standard slots, CHA-based, known spells", () => {
    const input = makeCasterInput({
      name: "Nara",
      classId: "sorcerer",
      level: 2,
      spellcastingAbility: "charisma",
      abilityScores: {
        strength: 8,
        dexterity: 10,
        constitution: 12,
        intelligence: 16,
        wisdom: 13,
        charisma: 16,
      },
      slotEffects: [{ slots: [3], resetOn: "long", source: "Spellcasting" }],
    });

    const state = computeCharacterState(input);

    expect(state.spellcasting).not.toBeNull();
    const sc = state.spellcasting!;
    expect(sc.ability).toBe("charisma");
    expect(sc.spellSaveDc).toBe(13); // 8 + 2 + 3
    expect(sc.spellAttackBonus).toBe(5); // 2 + 3
    expect(sc.slotPools).toHaveLength(1);

    // Sorcerer known spells at level 2
    const knownCount = getKnownSpellCount("sorcerer", 2);
    expect(knownCount).toBe(4);
  });

  it("Oriana (Warlock 2): pact magic slots (short rest), CHA-based", () => {
    const input = makeCasterInput({
      name: "Oriana",
      classId: "warlock",
      level: 2,
      spellcastingAbility: "charisma",
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 15,
        intelligence: 10,
        wisdom: 14,
        charisma: 17,
      },
      slotEffects: [{ slots: [2], resetOn: "short", source: "Pact Magic" }],
      spellAccess: [
        { spellName: "Eldritch Blast", alwaysPrepared: false, source: "Warlock" },
        { spellName: "Hex", alwaysPrepared: false, source: "Warlock" },
        { spellName: "Hellish Rebuke", alwaysPrepared: false, source: "Warlock" },
      ],
    });

    const state = computeCharacterState(input);

    expect(state.spellcasting).not.toBeNull();
    const sc = state.spellcasting!;
    expect(sc.ability).toBe("charisma");
    expect(sc.spellSaveDc).toBe(13);
    expect(sc.spellAttackBonus).toBe(5);

    // Pact magic slots reset on short rest
    expect(sc.slotPools).toHaveLength(1);
    expect(sc.slotPools[0]!.source).toBe("Pact Magic");
    expect(sc.slotPools[0]!.resetOn).toBe("short");
    expect(sc.slotPools[0]!.slots).toEqual([{ level: 1, total: 2, current: 2 }]);

    // Verify derived pact magic progression
    const pactSlots = derivePactMagicSlots(2);
    expect(pactSlots).toEqual({ count: 2, maxLevel: 1 });

    // Warlock known spells at level 2
    const knownCount = getKnownSpellCount("warlock", 2);
    expect(knownCount).toBe(3);

    // Verify pool definitions for persistence
    const poolDefs = buildSpellSlotPoolDefinitions(sc.slotPools);
    expect(poolDefs).toEqual([
      {
        slotLevel: 1,
        total: 2,
        resetOn: "short",
        source: "Pact Magic",
        resourceName: "Pact Magic Slot (Level 1)",
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Slot spend and recovery (pure function tests, no DB)
// ---------------------------------------------------------------------------

describe("spell slot pool definition resource naming", () => {
  it("standard slot pools use 'Spell Slot (Level N)' naming", () => {
    const defs = buildSpellSlotPoolDefinitions([
      {
        sourceName: "Druid 5 Spellcasting",
        source: "Spellcasting",
        resetOn: "long",
        slots: [
          { level: 1, total: 4, current: 4 },
          { level: 2, total: 3, current: 3 },
          { level: 3, total: 2, current: 2 },
        ],
      },
    ]);

    expect(defs.map((d) => d.resourceName)).toEqual([
      "Spell Slot (Level 1)",
      "Spell Slot (Level 2)",
      "Spell Slot (Level 3)",
    ]);
    for (const def of defs) {
      expect(def.resetOn).toBe("long");
    }
  });

  it("pact magic pools use 'Pact Magic Slot (Level N)' naming and short rest", () => {
    const defs = buildSpellSlotPoolDefinitions([
      {
        sourceName: "Warlock 5 Pact Magic",
        source: "Pact Magic",
        resetOn: "short",
        slots: [
          { level: 3, total: 2, current: 2 },
        ],
      },
    ]);

    expect(defs).toEqual([
      {
        slotLevel: 3,
        total: 2,
        resetOn: "short",
        source: "Pact Magic",
        resourceName: "Pact Magic Slot (Level 3)",
      },
    ]);
  });
});
