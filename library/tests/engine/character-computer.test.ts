import { describe, expect, it } from "vitest";
import {
  computeCharacterState,
  evaluatePrerequisites,
} from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

const sampleInput: CharacterComputationInput = {
  base: {
    name: "Viviana",
    progressionMode: "hybrid",
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 14,
      intelligence: 12,
      wisdom: 10,
      charisma: 17,
    },
    baseArmorClass: 13,
    baseMaxHP: 15,
    baseSpeed: 35,
    spellcastingAbility: "charisma",
  },
  sources: [
    {
      source: {
        id: "class-level-bard",
        kind: "class-level",
        name: "Bard 2",
        rank: 2,
      },
      effects: [
        { type: "proficiency", category: "skill", value: "Perception" },
        { type: "grant-action", action: { name: "Bardic Inspiration", timing: "bonus-action", description: "Give an ally inspiration." } },
        { type: "grant-resource", resource: { name: "Bardic Inspiration", maxUses: 3, resetOn: "long" } },
        {
          type: "grant-spell-access",
          spell: {
            spellName: "Faerie Fire",
            alwaysPrepared: false,
            source: "Bard",
          },
        },
      ],
    },
    {
      source: {
        id: "feat-alert",
        kind: "feat",
        name: "Alert",
      },
      effects: [
        { type: "modifier", target: "initiative", value: 2, condition: undefined },
      ],
    },
    {
      source: {
        id: "equipment-leather-armor",
        kind: "equipment",
        name: "Leather Armor",
      },
      effects: [
        { type: "set-ac-formula", formula: { base: 11, abilityModifiers: ["dexterity"], maxAC: undefined } },
      ],
    },
  ],
  xpLedger: [
    {
      id: "xp-1",
      timestamp: "2026-03-09T16:00:00.000Z",
      amount: 12,
      category: "award",
      note: "Session 1",
      sessionId: "session-1",
    },
    {
      id: "xp-2",
      timestamp: "2026-03-09T17:00:00.000Z",
      amount: 4,
      category: "spend-aa",
      note: "Bought an AA option",
      sessionId: "session-1",
    },
  ],
};

describe("computeCharacterState", () => {
  it("computes explainable hybrid character state from sources and xp", () => {
    const state = computeCharacterState(sampleInput);

    expect(state.level).toBe(2);
    expect(state.proficiencyBonus).toBe(2);
    expect(state.armorClass.total).toBe(13);
    expect(state.initiative.total).toBe(4);
    expect(state.speed).toBe(35);
    expect(state.passivePerception.total).toBe(12);
    expect(state.spellcasting?.spellAttackBonus).toBe(5);
    expect(state.spellcasting?.spellSaveDc).toBe(13);
    expect(state.actions.map((action) => action.name)).toContain("Bardic Inspiration");
    expect(state.resources.map((resource) => resource.name)).toContain("Bardic Inspiration");
    expect(state.xp.banked).toBe(8);
  });
});

describe("evaluatePrerequisites", () => {
  it("evaluates level, spellcasting, proficiency, and ability-score prerequisites", () => {
    const state = computeCharacterState(sampleInput);
    const result = evaluatePrerequisites(
      [
        { type: "level", value: "Level 2" },
        { type: "spellcasting", value: "Spellcasting" },
        { type: "proficiency", value: "Perception" },
        { type: "ability-score", value: "CHA 16" },
        { type: "ability", value: "Bard" },
      ],
      state,
    );

    expect(result.passed).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// core-resistance-grants: Resistance state appears in CharacterState
// ---------------------------------------------------------------------------

describe("resistance grants in computed state", () => {
  /** Oriana — Drow Warlock 2 with poison resistance from Fey Ancestry */
  const orianaWithResistance: CharacterComputationInput = {
    base: {
      name: "Oriana",
      progressionMode: "hybrid",
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 15,
        intelligence: 10,
        wisdom: 14,
        charisma: 17,
      },
      baseArmorClass: 12,
      baseMaxHP: 18,
      baseSpeed: 30,
      spellcastingAbility: "charisma",
    },
    sources: [
      {
        source: { id: "class-level-warlock", kind: "class-level", name: "Warlock 2", rank: 2 },
        effects: [],
      },
      {
        source: {
          id: "species-drow",
          kind: "species",
          name: "Drow",
          entityId: "species:drow",
          packId: "srd-5e-2024",
        },
        effects: [
          { type: "resistance", damageType: "poison", condition: "Fey Ancestry" },
          {
            type: "grant-trait",
            trait: {
              name: "Fey Ancestry",
              description: "You have advantage on saving throws you make to avoid or end the Charmed condition.",
              tags: ["advantage-vs-charmed"],
            },
          },
        ],
      },
    ],
    xpLedger: [],
  };

  it("Drow poison resistance appears in CharacterState.resistances", () => {
    const state = computeCharacterState(orianaWithResistance);
    expect(state.resistances).toBeDefined();
    expect(state.resistances.length).toBeGreaterThanOrEqual(1);
    const poisonResistance = state.resistances.find(
      (r) => r.damageType === "poison",
    );
    expect(poisonResistance).toBeDefined();
    expect(poisonResistance?.condition).toBe("Fey Ancestry");
  });

  /** Ronan — Goliath Fighter 2 with cold resistance */
  const ronanWithResistance: CharacterComputationInput = {
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
        source: { id: "class-level-fighter", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
      {
        source: {
          id: "species-goliath",
          kind: "species",
          name: "Goliath",
          entityId: "species:goliath",
          packId: "srd-5e-2024",
        },
        effects: [
          { type: "resistance", damageType: "cold" },
          {
            type: "grant-trait",
            trait: {
              name: "Giant Ancestry",
              description: "You inherit one giant-themed supernatural boon.",
            },
          },
        ],
      },
    ],
    xpLedger: [],
  };

  it("Goliath cold resistance appears in CharacterState.resistances", () => {
    const state = computeCharacterState(ronanWithResistance);
    expect(state.resistances).toBeDefined();
    expect(state.resistances.length).toBeGreaterThanOrEqual(1);
    const coldResistance = state.resistances.find(
      (r) => r.damageType === "cold",
    );
    expect(coldResistance).toBeDefined();
  });

  it("character without resistance effects has empty resistances array", () => {
    const state = computeCharacterState(sampleInput);
    expect(state.resistances).toBeDefined();
    expect(state.resistances).toHaveLength(0);
  });

  it("multiple resistances from different sources accumulate", () => {
    const multiResistInput: CharacterComputationInput = {
      base: {
        name: "Multi-Resist",
        progressionMode: "standard",
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 10,
        baseSpeed: 30,
      },
      sources: [
        {
          source: { id: "species", kind: "species", name: "Test Species" },
          effects: [
            { type: "resistance", damageType: "fire" },
            { type: "resistance", damageType: "cold", condition: "only while raging" },
          ],
        },
      ],
      xpLedger: [],
    };

    const state = computeCharacterState(multiResistInput);
    expect(state.resistances).toHaveLength(2);
    expect(state.resistances.find((r) => r.damageType === "fire")).toBeDefined();
    expect(state.resistances.find((r) => r.damageType === "cold")?.condition).toBe(
      "only while raging",
    );
  });
});

// ---------------------------------------------------------------------------
// core-immunity-grants: Immunity state appears in CharacterState
// ---------------------------------------------------------------------------

describe("immunity grants in computed state", () => {
  it("immunity effects appear in CharacterState.immunities", () => {
    const immunityInput: CharacterComputationInput = {
      base: {
        name: "Immune Character",
        progressionMode: "standard",
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 10,
        baseSpeed: 30,
      },
      sources: [
        {
          source: { id: "trait", kind: "species", name: "Construct" },
          effects: [
            { type: "immunity", damageType: "poison" },
            { type: "immunity", damageType: "psychic" },
          ],
        },
      ],
      xpLedger: [],
    };

    const state = computeCharacterState(immunityInput);
    expect(state.immunities).toBeDefined();
    expect(state.immunities).toContain("poison");
    expect(state.immunities).toContain("psychic");
  });

  it("immunities are deduplicated and sorted", () => {
    const dupeInput: CharacterComputationInput = {
      base: {
        name: "Dupe Test",
        progressionMode: "standard",
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 10,
        baseSpeed: 30,
      },
      sources: [
        {
          source: { id: "s1", kind: "species", name: "Source A" },
          effects: [{ type: "immunity", damageType: "fire" }],
        },
        {
          source: { id: "s2", kind: "feat", name: "Source B" },
          effects: [{ type: "immunity", damageType: "fire" }],
        },
      ],
      xpLedger: [],
    };

    const state = computeCharacterState(dupeInput);
    expect(state.immunities).toEqual(["fire"]);
  });

  it("character without immunities has empty immunities array", () => {
    const state = computeCharacterState(sampleInput);
    expect(state.immunities).toBeDefined();
    expect(state.immunities).toHaveLength(0);
  });
});
