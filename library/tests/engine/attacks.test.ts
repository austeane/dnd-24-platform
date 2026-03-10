import { describe, expect, it } from "vitest";
import { computeCharacterState } from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";
import type { SourceWithEffects } from "../../src/types/effect.ts";

// --- Roster-based test fixtures ---

/**
 * Ronan Wildspark — Fighter 2
 * Leather Armor (AC 11 + DEX), Shield (+2 AC), STR 13, DEX 17
 * Weapons: Longsword (main-hand, equipped), Javelin (carried x4)
 * Weapon Mastery feature: Longsword (Sap), Javelin (Slow)
 */
function makeRonanInput(): CharacterComputationInput {
  const sources: SourceWithEffects[] = [
    {
      source: {
        id: "class-level-fighter",
        kind: "class-level",
        name: "Fighter 2",
        rank: 2,
      },
      effects: [
        { type: "proficiency", category: "weapon", value: "simple weapons" },
        { type: "proficiency", category: "weapon", value: "martial weapons" },
        { type: "proficiency", category: "armor", value: "light" },
        { type: "proficiency", category: "armor", value: "medium" },
        { type: "proficiency", category: "armor", value: "heavy" },
        { type: "proficiency", category: "armor", value: "shield" },
      ],
    },
    {
      source: {
        id: "weapon-mastery-feature",
        kind: "class-feature",
        name: "Weapon Mastery",
        entityId: "class-feature:weapon-mastery",
        payload: {
          weaponMasteries: [
            { weaponEntityId: "equipment:longsword", masteryProperty: "Sap" },
            { weaponEntityId: "equipment:javelin", masteryProperty: "Slow" },
          ],
        },
      },
      effects: [],
    },
    {
      source: {
        id: "equipment-leather-armor",
        kind: "equipment",
        name: "Leather Armor",
        entityId: "equipment:leather-armor",
      },
      effects: [
        {
          type: "set-ac-formula",
          formula: { base: 11, abilityModifiers: ["dexterity"] },
        },
      ],
    },
    {
      source: {
        id: "equipment-shield",
        kind: "equipment",
        name: "Shield",
        entityId: "equipment:shield",
      },
      effects: [{ type: "modifier", target: "ac", value: 2 }],
    },
    {
      source: {
        id: "equipment-longsword",
        kind: "equipment",
        name: "Longsword",
        entityId: "equipment:longsword",
      },
      effects: [],
    },
    {
      source: {
        id: "equipment-javelin",
        kind: "equipment",
        name: "Javelin",
        entityId: "equipment:javelin",
      },
      effects: [],
    },
  ];

  return {
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
      baseArmorClass: 10,
      baseMaxHP: 22,
      baseSpeed: 30,
    },
    sources,
    xpLedger: [],
  };
}

/**
 * Tali — Druid 2
 * Leather Armor (AC 11 + DEX), Shield (+2 AC), STR 8, DEX 12
 * Weapons: Quarterstaff (main-hand, equipped)
 * No Weapon Mastery feature (druids don't get it)
 */
function makeTaliInput(): CharacterComputationInput {
  const sources: SourceWithEffects[] = [
    {
      source: {
        id: "class-level-druid",
        kind: "class-level",
        name: "Druid 2",
        rank: 2,
      },
      effects: [
        { type: "proficiency", category: "weapon", value: "simple weapons" },
        { type: "proficiency", category: "armor", value: "light" },
        { type: "proficiency", category: "armor", value: "medium" },
        { type: "proficiency", category: "armor", value: "shield" },
      ],
    },
    {
      source: {
        id: "equipment-leather-armor",
        kind: "equipment",
        name: "Leather Armor",
        entityId: "equipment:leather-armor",
      },
      effects: [
        {
          type: "set-ac-formula",
          formula: { base: 11, abilityModifiers: ["dexterity"] },
        },
      ],
    },
    {
      source: {
        id: "equipment-shield",
        kind: "equipment",
        name: "Shield",
        entityId: "equipment:shield",
      },
      effects: [{ type: "modifier", target: "ac", value: 2 }],
    },
    {
      source: {
        id: "equipment-quarterstaff",
        kind: "equipment",
        name: "Quarterstaff",
        entityId: "equipment:quarterstaff",
      },
      effects: [],
    },
  ];

  return {
    base: {
      name: "Tali",
      progressionMode: "hybrid",
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 14,
        intelligence: 14,
        wisdom: 17,
        charisma: 10,
      },
      baseArmorClass: 10,
      baseMaxHP: 19,
      baseSpeed: 30,
      spellcastingAbility: "wisdom",
    },
    sources,
    xpLedger: [],
  };
}

/**
 * Ronan with Chain Mail instead of Leather Armor.
 * Chain Mail: AC 16 flat (no DEX). Plus Shield (+2) = 18.
 */
function makeRonanChainMailInput(): CharacterComputationInput {
  const base = makeRonanInput();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- known test fixture indices
  const classLevel = base.sources[0]!;
  const weaponMastery = base.sources[1]!;
  const shield = base.sources[3]!;
  const longsword = base.sources[4]!;
  const javelin = base.sources[5]!;
  const sources: SourceWithEffects[] = [
    classLevel,
    weaponMastery,
    {
      source: {
        id: "equipment-chain-mail",
        kind: "equipment",
        name: "Chain Mail",
        entityId: "equipment:chain-mail",
      },
      effects: [
        {
          type: "set-ac-formula",
          formula: { base: 16, abilityModifiers: [] },
        },
      ],
    },
    shield,
    longsword,
    javelin,
  ];
  return { ...base, sources };
}

/**
 * Tali with Hide Armor instead of Leather Armor.
 * Hide Armor: AC 12 + DEX (max 2). DEX 12 (+1). Plus Shield (+2) = 15.
 */
function makeTaliHideArmorInput(): CharacterComputationInput {
  const base = makeTaliInput();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- known test fixture indices
  const classLevel = base.sources[0]!;
  const shield = base.sources[2]!;
  const quarterstaff = base.sources[3]!;
  const sources: SourceWithEffects[] = [
    classLevel,
    {
      source: {
        id: "equipment-hide-armor",
        kind: "equipment",
        name: "Hide Armor",
        entityId: "equipment:hide-armor",
      },
      effects: [
        {
          type: "set-ac-formula",
          formula: { base: 12, abilityModifiers: ["dexterity"], maxAC: 14 },
        },
      ],
    },
    shield,
    quarterstaff,
  ];
  return { ...base, sources };
}

// ---- AC Tests ----

describe("AC computation", () => {
  it("computes Ronan AC from leather armor + shield + DEX", () => {
    const state = computeCharacterState(makeRonanInput());
    // Leather Armor: 11 + DEX(+3) = 14, plus Shield +2 = 16
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
    expect(state.acBreakdown.armorBase).toBe(11);
    expect(state.acBreakdown.dexBonus).toBe(3);
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("computes Ronan AC from chain mail + shield (no DEX)", () => {
    const state = computeCharacterState(makeRonanChainMailInput());
    // Chain Mail: AC 16 flat + Shield +2 = 18
    expect(state.armorClass.total).toBe(18);
    expect(state.acBreakdown.armorName).toBe("Chain Mail");
    expect(state.acBreakdown.armorBase).toBe(16);
    expect(state.acBreakdown.dexBonus).toBeUndefined();
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("computes Tali AC from leather armor + shield + DEX", () => {
    const state = computeCharacterState(makeTaliInput());
    // Leather Armor: 11 + DEX(+1) = 12, plus Shield +2 = 14
    expect(state.armorClass.total).toBe(14);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
    expect(state.acBreakdown.armorBase).toBe(11);
    expect(state.acBreakdown.dexBonus).toBe(1);
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("computes Tali AC from hide armor + shield (DEX capped)", () => {
    const state = computeCharacterState(makeTaliHideArmorInput());
    // Hide Armor: 12 + DEX(+1, max +2) = 13, plus Shield +2 = 15
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.armorName).toBe("Hide Armor");
    expect(state.acBreakdown.armorBase).toBe(12);
    expect(state.acBreakdown.dexBonus).toBe(1);
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("falls back to base AC when no armor formula produces higher", () => {
    const input = makeRonanInput();
    // Remove armor and shield sources, just class-level + weapon mastery + weapons
    input.sources = input.sources.filter(
      (s) => s.source.kind !== "equipment" || s.source.entityId === "equipment:longsword" || s.source.entityId === "equipment:javelin",
    );
    const state = computeCharacterState(input);
    // Base AC of 10
    expect(state.armorClass.total).toBe(10);
    expect(state.acBreakdown.armorName).toBeUndefined();
  });

  it("explains AC contributors clearly", () => {
    const state = computeCharacterState(makeRonanChainMailInput());
    const names = state.armorClass.contributors.map((c) => c.sourceName);
    expect(names).toContain("Chain Mail AC formula");
    expect(names).toContain("Shield");
  });
});

// ---- Attack Profile Tests ----

describe("weapon attack profiles", () => {
  it("builds melee attack profile for Ronan longsword", () => {
    const state = computeCharacterState(makeRonanInput());
    const longsword = state.attackProfiles.find((p) => p.name === "Longsword");

    expect(longsword).toBeDefined();
    // DEX 17 (+3) > STR 13 (+1), but longsword is NOT finesse so uses STR
    // STR mod +1, proficiency +2 = +3
    expect(longsword!.ability).toBe("strength");
    expect(longsword!.attackBonus).toBe(3);
    expect(longsword!.damageDice).toBe("1d8");
    expect(longsword!.damageBonus).toBe(1); // STR mod
    expect(longsword!.damageType).toBe("slashing");
    expect(longsword!.attackType).toBe("melee");
    expect(longsword!.isProficient).toBe(true);
    expect(longsword!.properties).toContain("Versatile (1d10)");
  });

  it("builds melee and thrown attack profiles for Ronan javelin", () => {
    const state = computeCharacterState(makeRonanInput());
    const javelinMelee = state.attackProfiles.find(
      (p) => p.name === "Javelin" && p.attackType === "melee",
    );
    const javelinThrown = state.attackProfiles.find(
      (p) => p.name === "Javelin (Thrown)" && p.attackType === "ranged",
    );

    expect(javelinMelee).toBeDefined();
    expect(javelinThrown).toBeDefined();

    // Javelin melee: STR +1 + prof +2 = +3
    expect(javelinMelee!.attackBonus).toBe(3);
    expect(javelinMelee!.ability).toBe("strength");
    expect(javelinMelee!.damageDice).toBe("1d6");
    expect(javelinMelee!.damageType).toBe("piercing");

    // Javelin thrown: uses STR for thrown weapon, STR +1 + prof +2 = +3
    expect(javelinThrown!.attackBonus).toBe(3);
    expect(javelinThrown!.range).toBe("30/120");
  });

  it("builds melee attack profile for Tali quarterstaff", () => {
    const state = computeCharacterState(makeTaliInput());
    const quarterstaff = state.attackProfiles.find((p) => p.name === "Quarterstaff");

    expect(quarterstaff).toBeDefined();
    // STR 8 (-1) + prof +2 = +1
    expect(quarterstaff!.ability).toBe("strength");
    expect(quarterstaff!.attackBonus).toBe(1);
    expect(quarterstaff!.damageDice).toBe("1d6");
    expect(quarterstaff!.damageBonus).toBe(-1); // STR mod
    expect(quarterstaff!.damageType).toBe("bludgeoning");
    expect(quarterstaff!.isProficient).toBe(true);
    expect(quarterstaff!.properties).toContain("Versatile (1d8)");
  });
});

// ---- Weapon Mastery Tests ----

describe("weapon mastery", () => {
  it("assigns Sap mastery to Ronan longsword when Weapon Mastery feature is present", () => {
    const state = computeCharacterState(makeRonanInput());
    const longsword = state.attackProfiles.find((p) => p.name === "Longsword");
    expect(longsword!.masteryProperty).toBe("Sap");
  });

  it("assigns Slow mastery to Ronan javelin when Weapon Mastery feature is present", () => {
    const state = computeCharacterState(makeRonanInput());
    const javelinMelee = state.attackProfiles.find(
      (p) => p.name === "Javelin" && p.attackType === "melee",
    );
    expect(javelinMelee!.masteryProperty).toBe("Slow");
  });

  it("does not assign mastery to Tali quarterstaff (no Weapon Mastery feature)", () => {
    const state = computeCharacterState(makeTaliInput());
    const quarterstaff = state.attackProfiles.find((p) => p.name === "Quarterstaff");
    expect(quarterstaff!.masteryProperty).toBeUndefined();
  });

  it("does not assign mastery when feature exists but weapon has no mastery choice", () => {
    const input = makeRonanInput();
    // Add a dagger to Ronan but with no mastery choice for it
    input.sources.push({
      source: {
        id: "equipment-dagger",
        kind: "equipment",
        name: "Dagger",
        entityId: "equipment:dagger",
      },
      effects: [],
    });
    const state = computeCharacterState(input);
    const dagger = state.attackProfiles.find((p) => p.name === "Dagger");
    expect(dagger).toBeDefined();
    expect(dagger!.masteryProperty).toBeUndefined();
  });
});

// ---- Finesse Weapon Tests ----

describe("finesse weapons", () => {
  it("uses DEX for rapier when DEX is higher", () => {
    // Vivennah: STR 8, DEX 18
    const sources: SourceWithEffects[] = [
      {
        source: {
          id: "class-level-bard",
          kind: "class-level",
          name: "Bard 2",
          rank: 2,
        },
        effects: [
          { type: "proficiency", category: "weapon", value: "martial weapons" },
        ],
      },
      {
        source: {
          id: "equipment-rapier",
          kind: "equipment",
          name: "Rapier",
          entityId: "equipment:rapier",
        },
        effects: [],
      },
    ];

    const input: CharacterComputationInput = {
      base: {
        name: "Vivennah",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 8,
          dexterity: 18,
          constitution: 14,
          intelligence: 12,
          wisdom: 10,
          charisma: 17,
        },
        baseArmorClass: 10,
        baseMaxHP: 15,
        baseSpeed: 35,
      },
      sources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);
    const rapier = state.attackProfiles.find((p) => p.name === "Rapier");

    expect(rapier).toBeDefined();
    expect(rapier!.ability).toBe("dexterity");
    // DEX +4 + prof +2 = +6
    expect(rapier!.attackBonus).toBe(6);
    expect(rapier!.damageBonus).toBe(4); // DEX mod
    expect(rapier!.damageDice).toBe("1d8");
    expect(rapier!.damageType).toBe("piercing");
  });
});

// ---- Proficiency Tests ----

describe("weapon proficiency in attack profiles", () => {
  it("marks proficient when character has category proficiency", () => {
    const state = computeCharacterState(makeRonanInput());
    const longsword = state.attackProfiles.find((p) => p.name === "Longsword");
    expect(longsword!.isProficient).toBe(true);
  });

  it("marks non-proficient when character lacks weapon proficiency", () => {
    const sources: SourceWithEffects[] = [
      {
        source: {
          id: "class-level-wizard",
          kind: "class-level",
          name: "Wizard 1",
          rank: 1,
        },
        effects: [
          // Wizard has no martial weapon proficiency
          { type: "proficiency", category: "weapon", value: "Dagger" },
        ],
      },
      {
        source: {
          id: "equipment-longsword",
          kind: "equipment",
          name: "Longsword",
          entityId: "equipment:longsword",
        },
        effects: [],
      },
    ];

    const input: CharacterComputationInput = {
      base: {
        name: "Nara",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 8,
          dexterity: 10,
          constitution: 12,
          intelligence: 16,
          wisdom: 13,
          charisma: 16,
        },
        baseArmorClass: 10,
        baseMaxHP: 12,
        baseSpeed: 30,
      },
      sources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);
    const longsword = state.attackProfiles.find((p) => p.name === "Longsword");
    expect(longsword).toBeDefined();
    expect(longsword!.isProficient).toBe(false);
    // STR -1, no proficiency bonus
    expect(longsword!.attackBonus).toBe(-1);
  });
});

// ---- Ranged Weapon Tests ----

describe("ranged weapons", () => {
  it("uses DEX for longbow attack", () => {
    const sources: SourceWithEffects[] = [
      {
        source: {
          id: "class-level-fighter",
          kind: "class-level",
          name: "Fighter 2",
          rank: 2,
        },
        effects: [
          { type: "proficiency", category: "weapon", value: "martial weapons" },
        ],
      },
      {
        source: {
          id: "equipment-longbow",
          kind: "equipment",
          name: "Longbow",
          entityId: "equipment:longbow",
        },
        effects: [],
      },
    ];

    const input: CharacterComputationInput = {
      base: {
        name: "Archer",
        progressionMode: "standard",
        abilityScores: {
          strength: 10,
          dexterity: 16,
          constitution: 14,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
        baseArmorClass: 10,
        baseMaxHP: 22,
        baseSpeed: 30,
      },
      sources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);
    const longbow = state.attackProfiles.find((p) => p.name === "Longbow");

    expect(longbow).toBeDefined();
    expect(longbow!.ability).toBe("dexterity");
    expect(longbow!.attackType).toBe("ranged");
    // DEX +3 + prof +2 = +5
    expect(longbow!.attackBonus).toBe(5);
    expect(longbow!.damageBonus).toBe(3); // DEX mod
    expect(longbow!.range).toBe("150/600");
  });
});
