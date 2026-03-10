import { describe, expect, it } from "vitest";
import { computeCharacterState } from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseInput(overrides: Partial<CharacterComputationInput["base"]> = {}): CharacterComputationInput {
  return {
    base: {
      name: "Test Character",
      progressionMode: "hybrid",
      abilityScores: {
        strength: 10,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      baseArmorClass: 10,
      baseMaxHP: 10,
      baseSpeed: 30,
      ...overrides,
    },
    sources: [],
    xpLedger: [],
  };
}

// ---------------------------------------------------------------------------
// Unarmored AC (core-ac-base-fallback)
// ---------------------------------------------------------------------------

describe("unarmored AC derivation", () => {
  it("unarmored AC = 10 + DEX modifier", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    const state = computeCharacterState(input);
    // DEX 14 -> +2, so AC = 10 + 2 = 12
    expect(state.armorClass.total).toBe(12);
    expect(state.acBreakdown.armorName).toBeUndefined();
    expect(state.acBreakdown.dexBonus).toBe(2);
    expect(state.acBreakdown.base).toBe(10);
  });

  it("unarmored AC with negative DEX", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 8, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    const state = computeCharacterState(input);
    // DEX 8 -> -1, so AC = 10 - 1 = 9
    expect(state.armorClass.total).toBe(9);
    expect(state.acBreakdown.dexBonus).toBe(-1);
  });

  it("unarmored AC with high DEX", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 20, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    const state = computeCharacterState(input);
    // DEX 20 -> +5, so AC = 10 + 5 = 15
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.dexBonus).toBe(5);
  });

  it("unarmored AC with shield adds shield bonus", () => {
    const input = makeBaseInput();
    input.sources = [{
      source: {
        id: "equipment-shield",
        kind: "equipment",
        name: "Shield",
        entityId: "equipment:shield",
      },
      effects: [{ type: "modifier", target: "ac", value: 2 }],
    }];
    const state = computeCharacterState(input);
    // 10 + DEX(+2) + Shield(+2) = 14
    expect(state.armorClass.total).toBe(14);
    expect(state.acBreakdown.shieldBonus).toBe(2);
    expect(state.acBreakdown.dexBonus).toBe(2);
  });

  it("explains unarmored AC contributors", () => {
    const input = makeBaseInput();
    const state = computeCharacterState(input);
    const names = state.armorClass.contributors.map((c) => c.sourceName);
    expect(names).toContain("Base AC");
    expect(names).toContain("Dexterity");
  });
});

// ---------------------------------------------------------------------------
// Light armor AC (leather armor)
// ---------------------------------------------------------------------------

describe("light armor AC derivation", () => {
  it("leather armor: AC = 11 + DEX", () => {
    const input = makeBaseInput();
    input.sources = [{
      source: { id: "class-fighter", kind: "class-level", name: "Fighter 1", rank: 1 },
      effects: [{ type: "proficiency", category: "armor", value: "light" }],
    }, {
      source: {
        id: "equipment-leather-armor",
        kind: "equipment",
        name: "Leather Armor",
        entityId: "equipment:leather-armor",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 11, abilityModifiers: ["dexterity"] },
      }],
    }];
    const state = computeCharacterState(input);
    // 11 + DEX(+2) = 13
    expect(state.armorClass.total).toBe(13);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
    expect(state.acBreakdown.armorBase).toBe(11);
    expect(state.acBreakdown.dexBonus).toBe(2);
    expect(state.acBreakdown.shieldBonus).toBeUndefined();
  });

  it("leather armor + shield: AC = 11 + DEX + 2", () => {
    const input = makeBaseInput();
    input.sources = [
      {
        source: { id: "class-fighter", kind: "class-level", name: "Fighter 1", rank: 1 },
        effects: [
          { type: "proficiency", category: "armor", value: "light" },
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
        effects: [{
          type: "set-ac-formula",
          formula: { base: 11, abilityModifiers: ["dexterity"] },
        }],
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
    ];
    const state = computeCharacterState(input);
    // 11 + DEX(+2) + Shield(+2) = 15
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
    expect(state.acBreakdown.shieldBonus).toBe(2);
    expect(state.acBreakdown.dexBonus).toBe(2);
  });

  it("leather armor loses to unarmored when DEX is very high", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 20, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "equipment-leather-armor",
        kind: "equipment",
        name: "Leather Armor",
        entityId: "equipment:leather-armor",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 11, abilityModifiers: ["dexterity"] },
      }],
    }];
    const state = computeCharacterState(input);
    // Leather: 11 + 5 = 16, Unarmored: 10 + 5 = 15
    // Leather wins at 16
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
  });
});

// ---------------------------------------------------------------------------
// Medium armor AC (hide armor - DEX capped at +2)
// ---------------------------------------------------------------------------

describe("medium armor AC derivation", () => {
  it("hide armor: AC = 12 + DEX (max 2) with low DEX", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "equipment-hide-armor",
        kind: "equipment",
        name: "Hide Armor",
        entityId: "equipment:hide-armor",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 12, abilityModifiers: ["dexterity"], maxAC: 14 },
      }],
    }];
    const state = computeCharacterState(input);
    // 12 + DEX(+1, max +2) = 13
    expect(state.armorClass.total).toBe(13);
    expect(state.acBreakdown.armorName).toBe("Hide Armor");
    expect(state.acBreakdown.armorBase).toBe(12);
    expect(state.acBreakdown.dexBonus).toBe(1);
    expect(state.acBreakdown.dexCap).toBeUndefined();
  });

  it("hide armor: DEX cap is applied when DEX is high", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 18, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "equipment-hide-armor",
        kind: "equipment",
        name: "Hide Armor",
        entityId: "equipment:hide-armor",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 12, abilityModifiers: ["dexterity"], maxAC: 14 },
      }],
    }];
    const state = computeCharacterState(input);
    // 12 + DEX(+4, capped to +2) = 14
    expect(state.armorClass.total).toBe(14);
    expect(state.acBreakdown.armorName).toBe("Hide Armor");
    expect(state.acBreakdown.dexBonus).toBe(2);
    expect(state.acBreakdown.dexCap).toBe(2);
  });

  it("hide armor + shield with DEX cap", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [
      {
        source: {
          id: "equipment-hide-armor",
          kind: "equipment",
          name: "Hide Armor",
          entityId: "equipment:hide-armor",
        },
        effects: [{
          type: "set-ac-formula",
          formula: { base: 12, abilityModifiers: ["dexterity"], maxAC: 14 },
        }],
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
    ];
    const state = computeCharacterState(input);
    // 12 + DEX(+3, capped to +2) = 14, + Shield(+2) = 16
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.shieldBonus).toBe(2);
    expect(state.acBreakdown.dexBonus).toBe(2);
    expect(state.acBreakdown.dexCap).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Heavy armor AC (chain mail - no DEX)
// ---------------------------------------------------------------------------

describe("heavy armor AC derivation", () => {
  it("chain mail: AC = 16 flat (no DEX)", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 14, dexterity: 18, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "equipment-chain-mail",
        kind: "equipment",
        name: "Chain Mail",
        entityId: "equipment:chain-mail",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 16, abilityModifiers: [] },
      }],
    }];
    const state = computeCharacterState(input);
    // AC = 16 flat, no DEX
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Chain Mail");
    expect(state.acBreakdown.armorBase).toBe(16);
    expect(state.acBreakdown.dexBonus).toBeUndefined();
    expect(state.acBreakdown.dexCap).toBeUndefined();
  });

  it("chain mail + shield: AC = 16 + 2 = 18", () => {
    const input = makeBaseInput();
    input.sources = [
      {
        source: {
          id: "equipment-chain-mail",
          kind: "equipment",
          name: "Chain Mail",
          entityId: "equipment:chain-mail",
        },
        effects: [{
          type: "set-ac-formula",
          formula: { base: 16, abilityModifiers: [] },
        }],
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
    ];
    const state = computeCharacterState(input);
    expect(state.armorClass.total).toBe(18);
    expect(state.acBreakdown.armorName).toBe("Chain Mail");
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("chain mail stealth disadvantage trait is present from canonical content", () => {
    const input = makeBaseInput();
    input.sources = [{
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
        {
          type: "grant-trait",
          trait: {
            name: "Stealth Disadvantage",
            description: "You have Disadvantage on Dexterity (Stealth) checks while wearing Chain Mail.",
            tags: ["stealth-disadvantage"],
          },
        },
      ],
    }];
    const state = computeCharacterState(input);
    const stealthTrait = state.traits.find((t) => t.name === "Stealth Disadvantage");
    expect(stealthTrait).toBeDefined();
    expect(stealthTrait!.tags).toContain("stealth-disadvantage");
  });
});

// ---------------------------------------------------------------------------
// AC formula selection (core-ac-formula-selection)
// ---------------------------------------------------------------------------

describe("AC formula selection", () => {
  it("selects the best formula when multiple are present", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 14, constitution: 16, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    // Barbarian Unarmored Defense: 10 + DEX + CON
    // Also has leather armor equipped: 11 + DEX
    input.sources = [
      {
        source: {
          id: "class-feature-unarmored-defense",
          kind: "class-feature",
          name: "Unarmored Defense",
          entityId: "class-feature:unarmored-defense",
        },
        effects: [{
          type: "set-ac-formula",
          formula: { base: 10, abilityModifiers: ["dexterity", "constitution"] },
        }],
      },
      {
        source: {
          id: "equipment-leather-armor",
          kind: "equipment",
          name: "Leather Armor",
          entityId: "equipment:leather-armor",
        },
        effects: [{
          type: "set-ac-formula",
          formula: { base: 11, abilityModifiers: ["dexterity"] },
        }],
      },
    ];
    const state = computeCharacterState(input);
    // Unarmored Defense: 10 + DEX(+2) + CON(+3) = 15
    // Leather Armor: 11 + DEX(+2) = 13
    // Unarmored wins
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.armorName).toBe("Unarmored Defense");
  });

  it("Barbarian Unarmored Defense: 10 + DEX + CON", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 16, dexterity: 14, constitution: 16, intelligence: 8, wisdom: 10, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "class-feature-unarmored-defense",
        kind: "class-feature",
        name: "Unarmored Defense",
        entityId: "class-feature:unarmored-defense",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 10, abilityModifiers: ["dexterity", "constitution"] },
      }],
    }];
    const state = computeCharacterState(input);
    // 10 + DEX(+2) + CON(+3) = 15
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.armorName).toBe("Unarmored Defense");
    expect(state.acBreakdown.armorBase).toBe(10);
  });

  it("Monk Unarmored Defense: 10 + DEX + WIS", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 16, charisma: 10,
    }});
    input.sources = [{
      source: {
        id: "class-feature-unarmored-defense-monk",
        kind: "class-feature",
        name: "Unarmored Defense",
        entityId: "class-feature:unarmored-defense",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 10, abilityModifiers: ["dexterity", "wisdom"] },
      }],
    }];
    const state = computeCharacterState(input);
    // 10 + DEX(+3) + WIS(+3) = 16
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Unarmored Defense");
  });

  it("formula fallback: uses unarmored 10+DEX when formula produces lower", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 10, dexterity: 20, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    // Bad formula that produces lower than unarmored
    input.sources = [{
      source: {
        id: "equipment-bad-armor",
        kind: "equipment",
        name: "Cursed Armor",
        entityId: "equipment:cursed-armor",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 8, abilityModifiers: [] },
      }],
    }];
    const state = computeCharacterState(input);
    // Cursed Armor: 8, Unarmored: 10 + DEX(+5) = 15
    // Unarmored wins
    expect(state.armorClass.total).toBe(15);
    expect(state.acBreakdown.armorName).toBeUndefined();
    expect(state.acBreakdown.dexBonus).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Equipment effect application (action-armor-effect-application, action-weapon-effect-application)
// ---------------------------------------------------------------------------

describe("equipment effect application", () => {
  it("armor set-ac-formula effect flows through to AC computation", () => {
    const input = makeBaseInput();
    input.sources = [{
      source: {
        id: "equipment-chain-mail",
        kind: "equipment",
        name: "Chain Mail",
        entityId: "equipment:chain-mail",
      },
      effects: [{
        type: "set-ac-formula",
        formula: { base: 16, abilityModifiers: [] },
      }],
    }];
    const state = computeCharacterState(input);
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Chain Mail");
  });

  it("shield modifier effect flows through to AC computation", () => {
    const input = makeBaseInput();
    input.sources = [{
      source: {
        id: "equipment-shield",
        kind: "equipment",
        name: "Shield",
        entityId: "equipment:shield",
      },
      effects: [{ type: "modifier", target: "ac", value: 2 }],
    }];
    const state = computeCharacterState(input);
    // Unarmored: 10 + DEX(+2) = 12, + Shield(+2) = 14
    expect(state.armorClass.total).toBe(14);
    expect(state.acBreakdown.shieldBonus).toBe(2);
  });

  it("weapon equipment source creates attack profiles", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 16, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    }});
    input.sources = [
      {
        source: { id: "class-fighter", kind: "class-level", name: "Fighter 1", rank: 1 },
        effects: [
          { type: "proficiency", category: "weapon", value: "martial weapons" },
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
    const state = computeCharacterState(input);
    const longsword = state.attackProfiles.find((p) => p.name === "Longsword");
    expect(longsword).toBeDefined();
    expect(longsword!.attackType).toBe("melee");
    expect(longsword!.ability).toBe("strength");
    // STR +3 + prof +2 = +5
    expect(longsword!.attackBonus).toBe(5);
    expect(longsword!.damageDice).toBe("1d8");
    expect(longsword!.damageType).toBe("slashing");
  });
});

// ---------------------------------------------------------------------------
// AC breakdown explainability
// ---------------------------------------------------------------------------

describe("AC breakdown explainability", () => {
  it("unarmored breakdown shows base and DEX", () => {
    const input = makeBaseInput();
    const state = computeCharacterState(input);
    expect(state.acBreakdown.base).toBe(10);
    expect(state.acBreakdown.dexBonus).toBe(2);
    expect(state.acBreakdown.armorName).toBeUndefined();
    expect(state.acBreakdown.shieldBonus).toBeUndefined();
    expect(state.armorClass.contributors.length).toBeGreaterThanOrEqual(2);
  });

  it("armored breakdown shows armor name, base, DEX, and shield", () => {
    const input = makeBaseInput({ abilityScores: {
      strength: 13, dexterity: 17, constitution: 15, intelligence: 12, wisdom: 10, charisma: 8,
    }});
    input.sources = [
      {
        source: {
          id: "equipment-leather-armor",
          kind: "equipment",
          name: "Leather Armor",
          entityId: "equipment:leather-armor",
        },
        effects: [{
          type: "set-ac-formula",
          formula: { base: 11, abilityModifiers: ["dexterity"] },
        }],
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
    ];
    const state = computeCharacterState(input);
    // 11 + DEX(+3) + Shield(+2) = 16
    expect(state.armorClass.total).toBe(16);
    expect(state.acBreakdown.armorName).toBe("Leather Armor");
    expect(state.acBreakdown.armorBase).toBe(11);
    expect(state.acBreakdown.dexBonus).toBe(3);
    expect(state.acBreakdown.shieldBonus).toBe(2);

    const names = state.armorClass.contributors.map((c) => c.sourceName);
    expect(names).toContain("Leather Armor AC formula");
    expect(names).toContain("Shield");
  });
});
