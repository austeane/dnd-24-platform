import { describe, expect, it } from "vitest";
import {
  applyPactBladeCharismaSubstitution,
  buildBardicInspirationDieTrait,
  buildBardicInspirationPool,
  buildCasterClassFeatureEffects,
  buildFontOfMagicConversionTrait,
  buildFontOfMagicPool,
  buildMagicalCunningTrait,
  buildMetamagicTraits,
  computeBardicInspirationMaxUses,
  computeCharacterState,
  computeMagicalCunningRecovery,
  computeSorceryPointsMax,
  extractMetamagicChoices,
  extractPactBladeBond,
  getBardicInspirationDie,
  getClassLevel,
  getMetamagicCost,
  hasMagicalCunning,
  hasPactOfTheBlade,
  SORCERY_POINT_SLOT_COST,
} from "../../src/index.ts";
import type { AbilityScoreSet, AttackProfile, CharacterComputationInput } from "../../src/types/character.ts";
import type { SourceWithEffects } from "../../src/types/effect.ts";

// ---------------------------------------------------------------------------
// Roster Fixtures
// ---------------------------------------------------------------------------

/**
 * Oriana — Warlock 2, Drow, Skilled
 * Has: Magical Cunning, Pact of the Blade
 */
const orianaSources: SourceWithEffects[] = [
  {
    source: {
      id: "class-level-warlock",
      kind: "class-level",
      name: "Warlock 2",
      rank: 2,
    },
    effects: [],
  },
  {
    source: {
      id: "magical-cunning",
      kind: "class-feature",
      name: "Magical Cunning",
      entityId: "class-feature:magical-cunning",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-action",
        action: {
          name: "Magical Cunning",
          timing: "special",
          description:
            "Perform a 1-minute rite to recover expended Pact Magic spell slots up to half your maximum.",
        },
      },
      {
        type: "grant-resource",
        resource: { name: "Magical Cunning", maxUses: 1, resetOn: "long" },
      },
    ],
  },
  {
    source: {
      id: "pact-of-the-blade",
      kind: "class-feature",
      name: "Pact of the Blade",
      entityId: "class-feature:pact-of-the-blade",
      packId: "srd-5e-2024",
      payload: {
        pactBladeBond: {
          weaponLabel: "Pact Weapon (conjured)",
          isMagicWeapon: false,
        },
      },
    },
    effects: [
      {
        type: "grant-action",
        action: {
          name: "Pact of the Blade",
          timing: "bonus-action",
          description: "Conjure a pact weapon or renew your bond with a magic weapon.",
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Pact Weapon",
          description:
            "You are proficient with your bonded weapon, can use it as a spellcasting focus, and can use Charisma for its attack and damage rolls.",
        },
      },
    ],
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
      { type: "grant-sense", sense: { sense: "Darkvision", range: 120 } },
    ],
  },
];

const orianaAbilities: AbilityScoreSet = {
  strength: 8,
  dexterity: 12,
  constitution: 15,
  intelligence: 10,
  wisdom: 14,
  charisma: 17,
};

const orianaInput: CharacterComputationInput = {
  base: {
    name: "Oriana",
    progressionMode: "hybrid",
    abilityScores: orianaAbilities,
    baseArmorClass: 12,
    baseMaxHP: 18,
    baseSpeed: 30,
    spellcastingAbility: "charisma",
  },
  sources: orianaSources,
  xpLedger: [],
};

/**
 * Vivennah — Bard 2, Wood Elf, Musician
 */
const vivennahSources: SourceWithEffects[] = [
  {
    source: {
      id: "class-level-bard",
      kind: "class-level",
      name: "Bard 2",
      rank: 2,
    },
    effects: [],
  },
  {
    source: {
      id: "bardic-inspiration",
      kind: "class-feature",
      name: "Bardic Inspiration",
      entityId: "class-feature:bardic-inspiration",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-action",
        action: {
          name: "Bardic Inspiration",
          timing: "bonus-action",
          description: "Give one creature within 60 feet a Bardic Inspiration die for the next hour.",
        },
      },
      {
        type: "grant-scaling-resource",
        resource: {
          name: "Bardic Inspiration",
          baseUses: 0,
          ability: "charisma",
          minimum: 1,
          resetOn: "long",
        },
      },
    ],
  },
  {
    source: {
      id: "species-wood-elf",
      kind: "species",
      name: "Wood Elf",
      entityId: "species:wood-elf",
      packId: "srd-5e-2024",
    },
    effects: [
      { type: "speed-bonus", value: 5, movementType: "walk" },
    ],
  },
  {
    source: {
      id: "feat-musician",
      kind: "feat",
      name: "Musician",
      entityId: "feat:musician",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-trait",
        trait: {
          name: "Musician",
          description:
            "When you finish a Short or Long Rest, you can play a song on a musical instrument and give Bardic Inspiration to allies who hear it.",
          tags: ["short-rest-benefit", "bardic-inspiration-recovery"],
        },
      },
    ],
  },
];

const vivennahAbilities: AbilityScoreSet = {
  strength: 8,
  dexterity: 18,
  constitution: 14,
  intelligence: 12,
  wisdom: 10,
  charisma: 17,
};

const vivennahInput: CharacterComputationInput = {
  base: {
    name: "Vivennah",
    progressionMode: "hybrid",
    abilityScores: vivennahAbilities,
    baseArmorClass: 13,
    baseMaxHP: 15,
    baseSpeed: 30,
    spellcastingAbility: "charisma",
  },
  sources: vivennahSources,
  xpLedger: [],
};

/**
 * Nara — Sorcerer 2, Magic Initiate (Wizard)
 * Has: Font of Magic, Metamagic (Subtle Spell, Twinned Spell)
 */
const naraSources: SourceWithEffects[] = [
  {
    source: {
      id: "class-level-sorcerer",
      kind: "class-level",
      name: "Sorcerer 2",
      rank: 2,
    },
    effects: [],
  },
  {
    source: {
      id: "font-of-magic",
      kind: "class-feature",
      name: "Font of Magic",
      entityId: "class-feature:font-of-magic",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-resource",
        resource: { name: "Sorcery Points", maxUses: 2, resetOn: "long" },
      },
      {
        type: "grant-action",
        action: {
          name: "Create Spell Slot",
          timing: "bonus-action",
          description: "Spend Sorcery Points to create a spell slot allowed by your sorcerer level.",
        },
      },
    ],
  },
  {
    source: {
      id: "metamagic",
      kind: "class-feature",
      name: "Metamagic",
      entityId: "class-feature:metamagic",
      packId: "srd-5e-2024",
      payload: {
        metamagicChoices: ["Subtle Spell", "Twinned Spell"],
      },
    },
    effects: [
      {
        type: "grant-trait",
        trait: {
          name: "Metamagic",
          description:
            "Choose Metamagic options and spend Sorcery Points to modify your spells.",
        },
      },
    ],
  },
  {
    source: {
      id: "feat-magic-initiate",
      kind: "feat",
      name: "Magic Initiate (Wizard)",
      entityId: "feat:magic-initiate",
      packId: "srd-5e-2024",
      payload: {
        subChoicesJson: {
          spellList: "wizard",
          cantrips: ["Fire Bolt", "Mage Hand"],
          level1Spell: "Shield",
        },
      },
    },
    effects: [
      {
        type: "grant-resource",
        resource: { name: "Magic Initiate Free Cast", maxUses: 1, resetOn: "long" },
      },
    ],
  },
];

const naraAbilities: AbilityScoreSet = {
  strength: 8,
  dexterity: 10,
  constitution: 12,
  intelligence: 16,
  wisdom: 13,
  charisma: 16,
};

const naraInput: CharacterComputationInput = {
  base: {
    name: "Nara",
    progressionMode: "hybrid",
    abilityScores: naraAbilities,
    baseArmorClass: 10,
    baseMaxHP: 12,
    baseSpeed: 30,
    spellcastingAbility: "charisma",
  },
  sources: naraSources,
  xpLedger: [],
};

// ---------------------------------------------------------------------------
// Magical Cunning (Warlock) — Oriana
// ---------------------------------------------------------------------------

describe("Magical Cunning — Oriana (Warlock 2)", () => {
  it("detects Magical Cunning feature presence", () => {
    expect(hasMagicalCunning(orianaSources)).toBe(true);
  });

  it("returns false for characters without Magical Cunning", () => {
    expect(hasMagicalCunning(vivennahSources)).toBe(false);
    expect(hasMagicalCunning(naraSources)).toBe(false);
  });

  it("computes recovery = ceil(maxSlots / 2) at warlock level 2", () => {
    // Warlock 2: 2 pact slots, ceil(2/2) = 1
    expect(computeMagicalCunningRecovery(2)).toBe(1);
  });

  it("computes recovery at higher warlock levels", () => {
    // Warlock 11: 3 pact slots, ceil(3/2) = 2
    expect(computeMagicalCunningRecovery(11)).toBe(2);
    // Warlock 17: 4 pact slots, ceil(4/2) = 2
    expect(computeMagicalCunningRecovery(17)).toBe(2);
  });

  it("builds Magical Cunning trait with correct recovery for Oriana", () => {
    const trait = buildMagicalCunningTrait(orianaSources, 2);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Magical Cunning");
    expect(trait!.description).toContain("1 expended Pact Magic slot");
    expect(trait!.tags).toContain("slot-recovery");
    expect(trait!.tags).toContain("once-per-long-rest");
  });

  it("returns null for non-warlock characters", () => {
    expect(buildMagicalCunningTrait(vivennahSources, 2)).toBeNull();
  });

  it("Magical Cunning action appears in computed state", () => {
    const state = computeCharacterState(orianaInput);
    const action = state.actions.find((a) => a.name === "Magical Cunning");
    expect(action).toBeDefined();
    expect(action!.timing).toBe("special");
  });

  it("Magical Cunning resource pool (1 use / long rest) appears in computed state", () => {
    const state = computeCharacterState(orianaInput);
    const resource = state.resources.find((r) => r.name === "Magical Cunning");
    expect(resource).toBeDefined();
    expect(resource!.maxUses).toBe(1);
    expect(resource!.resetOn).toBe("long");
  });
});

// ---------------------------------------------------------------------------
// Pact of the Blade — Oriana
// ---------------------------------------------------------------------------

describe("Pact of the Blade — Oriana (Warlock 2)", () => {
  it("detects Pact of the Blade feature presence", () => {
    expect(hasPactOfTheBlade(orianaSources)).toBe(true);
  });

  it("returns false for non-warlock characters", () => {
    expect(hasPactOfTheBlade(vivennahSources)).toBe(false);
    expect(hasPactOfTheBlade(naraSources)).toBe(false);
  });

  it("extracts pact blade bond info from source payload", () => {
    const bond = extractPactBladeBond(orianaSources);
    expect(bond).not.toBeNull();
    expect(bond!.weaponLabel).toBe("Pact Weapon (conjured)");
    expect(bond!.isMagicWeapon).toBe(false);
  });

  it("returns null bond info when no payload present", () => {
    const sourcesWithoutPayload: SourceWithEffects[] = [
      {
        source: {
          id: "pact",
          kind: "class-feature",
          name: "Pact of the Blade",
          entityId: "class-feature:pact-of-the-blade",
        },
        effects: [],
      },
    ];
    expect(extractPactBladeBond(sourcesWithoutPayload)).toBeNull();
  });

  it("applies Charisma substitution when CHA is better than STR for melee", () => {
    const profile: AttackProfile = {
      name: "Longsword",
      weaponEntityId: "equipment:longsword",
      attackType: "melee",
      ability: "strength",
      attackBonus: 1, // STR -1 + prof 2
      attackExplanation: {
        total: 1,
        contributors: [
          { sourceName: "Strength", value: -1, condition: undefined },
          { sourceName: "Proficiency", value: 2, condition: undefined },
        ],
      },
      damageDice: "1d8",
      damageBonus: -1, // STR -1
      damageType: "slashing",
      range: undefined,
      properties: ["Versatile (1d10)"],
      masteryProperty: undefined,
      isProficient: true,
    };

    const result = applyPactBladeCharismaSubstitution(
      profile,
      orianaAbilities,
      "equipment:longsword",
      2,
    );

    // CHA 17 = +3, STR 8 = -1; CHA should be substituted
    expect(result.ability).toBe("charisma");
    expect(result.attackBonus).toBe(5); // CHA +3 + prof 2
    expect(result.damageBonus).toBe(3); // CHA +3
  });

  it("does not substitute when weapon is not the bonded weapon", () => {
    const profile: AttackProfile = {
      name: "Dagger",
      weaponEntityId: "equipment:dagger",
      attackType: "melee",
      ability: "dexterity",
      attackBonus: 3,
      attackExplanation: {
        total: 3,
        contributors: [
          { sourceName: "Dexterity", value: 1, condition: undefined },
          { sourceName: "Proficiency", value: 2, condition: undefined },
        ],
      },
      damageDice: "1d4",
      damageBonus: 1,
      damageType: "piercing",
      range: "20/60",
      properties: ["Finesse", "Light", "Thrown (20/60)"],
      masteryProperty: undefined,
      isProficient: true,
    };

    const result = applyPactBladeCharismaSubstitution(
      profile,
      orianaAbilities,
      "equipment:longsword",
      2,
    );

    // Should remain unchanged — different weapon
    expect(result.ability).toBe("dexterity");
    expect(result.attackBonus).toBe(3);
  });

  it("does not substitute when CHA is not better", () => {
    const highStrAbilities: AbilityScoreSet = {
      strength: 20,
      dexterity: 10,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 14,
    };

    const profile: AttackProfile = {
      name: "Longsword",
      weaponEntityId: "equipment:longsword",
      attackType: "melee",
      ability: "strength",
      attackBonus: 7, // STR +5 + prof 2
      attackExplanation: {
        total: 7,
        contributors: [
          { sourceName: "Strength", value: 5, condition: undefined },
          { sourceName: "Proficiency", value: 2, condition: undefined },
        ],
      },
      damageDice: "1d8",
      damageBonus: 5,
      damageType: "slashing",
      range: undefined,
      properties: ["Versatile (1d10)"],
      masteryProperty: undefined,
      isProficient: true,
    };

    const result = applyPactBladeCharismaSubstitution(
      profile,
      highStrAbilities,
      "equipment:longsword",
      2,
    );

    // STR +5 > CHA +2, no substitution
    expect(result.ability).toBe("strength");
    expect(result.attackBonus).toBe(7);
  });

  it("Pact Weapon trait appears in computed state", () => {
    const state = computeCharacterState(orianaInput);
    const trait = state.traits.find((t) => t.name === "Pact Weapon");
    expect(trait).toBeDefined();
    expect(trait!.description).toContain("Charisma");
  });
});

// ---------------------------------------------------------------------------
// Bardic Inspiration — Vivennah
// ---------------------------------------------------------------------------

describe("Bardic Inspiration — Vivennah (Bard 2)", () => {
  it("computes max uses = CHA modifier (minimum 1)", () => {
    // CHA 17 = +3
    expect(computeBardicInspirationMaxUses(vivennahAbilities)).toBe(3);
  });

  it("enforces minimum 1 use", () => {
    const lowCha: AbilityScoreSet = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 6,
    };
    expect(computeBardicInspirationMaxUses(lowCha)).toBe(1);
  });

  it("die is d6 at bard level 2", () => {
    expect(getBardicInspirationDie(2)).toBe("d6");
  });

  it("die scales correctly through levels", () => {
    expect(getBardicInspirationDie(1)).toBe("d6");
    expect(getBardicInspirationDie(4)).toBe("d6");
    expect(getBardicInspirationDie(5)).toBe("d8");
    expect(getBardicInspirationDie(9)).toBe("d8");
    expect(getBardicInspirationDie(10)).toBe("d10");
    expect(getBardicInspirationDie(14)).toBe("d10");
    expect(getBardicInspirationDie(15)).toBe("d12");
    expect(getBardicInspirationDie(20)).toBe("d12");
  });

  it("builds Bardic Inspiration pool with Musician short-rest reset", () => {
    const pool = buildBardicInspirationPool(vivennahSources, vivennahAbilities);
    expect(pool).not.toBeNull();
    expect(pool!.resourceName).toBe("Bardic Inspiration");
    expect(pool!.maxUses).toBe(3); // CHA +3
    expect(pool!.resetOn).toBe("short"); // Musician feat
  });

  it("builds Bardic Inspiration pool with long-rest reset without Musician", () => {
    const sourcesWithoutMusician = vivennahSources.filter(
      (s) => s.source.kind !== "feat",
    );
    const pool = buildBardicInspirationPool(sourcesWithoutMusician, vivennahAbilities);
    expect(pool).not.toBeNull();
    expect(pool!.resetOn).toBe("long");
  });

  it("returns null pool for non-bard characters", () => {
    const pool = buildBardicInspirationPool(orianaSources, orianaAbilities);
    expect(pool).toBeNull();
  });

  it("builds die scaling trait for level 2", () => {
    const trait = buildBardicInspirationDieTrait(vivennahSources, 2);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Bardic Inspiration Die");
    expect(trait!.description).toContain("d6");
    expect(trait!.tags).toContain("die-d6");
  });

  it("Bardic Inspiration action appears in computed state", () => {
    const state = computeCharacterState(vivennahInput);
    const action = state.actions.find((a) => a.name === "Bardic Inspiration");
    expect(action).toBeDefined();
    expect(action!.timing).toBe("bonus-action");
  });

  it("Bardic Inspiration resource appears in computed state", () => {
    const state = computeCharacterState(vivennahInput);
    const resource = state.resources.find((r) => r.name === "Bardic Inspiration");
    expect(resource).toBeDefined();
    // CHA 17 = +3, via grant-scaling-resource: baseUses=0 + CHA mod +3 = 3
    expect(resource!.maxUses).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Font of Magic — Nara
// ---------------------------------------------------------------------------

describe("Font of Magic — Nara (Sorcerer 2)", () => {
  it("computes sorcery points max = sorcerer level", () => {
    expect(computeSorceryPointsMax(2)).toBe(2);
    expect(computeSorceryPointsMax(10)).toBe(10);
    expect(computeSorceryPointsMax(20)).toBe(20);
  });

  it("builds Font of Magic pool for Nara at level 2", () => {
    const pool = buildFontOfMagicPool(naraSources, 2);
    expect(pool).not.toBeNull();
    expect(pool!.resourceName).toBe("Sorcery Points");
    expect(pool!.maxUses).toBe(2);
    expect(pool!.resetOn).toBe("long");
  });

  it("returns null pool for non-sorcerer characters", () => {
    expect(buildFontOfMagicPool(orianaSources, 2)).toBeNull();
    expect(buildFontOfMagicPool(vivennahSources, 2)).toBeNull();
  });

  it("builds conversion trait for level 2", () => {
    const trait = buildFontOfMagicConversionTrait(naraSources, 2);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Font of Magic Conversion");
    expect(trait!.description).toContain("level 1");
    expect(trait!.tags).toContain("sorcery-points");
  });

  it("conversion trait scales max slot level with sorcerer level", () => {
    const trait5 = buildFontOfMagicConversionTrait(naraSources, 5);
    expect(trait5!.description).toContain("level 3");

    const trait9 = buildFontOfMagicConversionTrait(naraSources, 9);
    expect(trait9!.description).toContain("level 5");
  });

  it("sorcery point to slot cost table is correct", () => {
    expect(SORCERY_POINT_SLOT_COST.get(1)).toBe(2);
    expect(SORCERY_POINT_SLOT_COST.get(2)).toBe(3);
    expect(SORCERY_POINT_SLOT_COST.get(3)).toBe(5);
    expect(SORCERY_POINT_SLOT_COST.get(4)).toBe(6);
    expect(SORCERY_POINT_SLOT_COST.get(5)).toBe(7);
  });

  it("Sorcery Points resource appears in computed state", () => {
    const state = computeCharacterState(naraInput);
    const resource = state.resources.find((r) => r.name === "Sorcery Points");
    expect(resource).toBeDefined();
    expect(resource!.maxUses).toBe(2);
    expect(resource!.resetOn).toBe("long");
  });

  it("Create Spell Slot action appears in computed state", () => {
    const state = computeCharacterState(naraInput);
    const action = state.actions.find((a) => a.name === "Create Spell Slot");
    expect(action).toBeDefined();
    expect(action!.timing).toBe("bonus-action");
  });
});

// ---------------------------------------------------------------------------
// Metamagic — Nara
// ---------------------------------------------------------------------------

describe("Metamagic — Nara (Sorcerer 2)", () => {
  it("extracts metamagic choices from source payload", () => {
    const choices = extractMetamagicChoices(naraSources);
    expect(choices).toHaveLength(2);
    expect(choices).toContain("Subtle Spell");
    expect(choices).toContain("Twinned Spell");
  });

  it("returns empty array when no metamagic choices present", () => {
    expect(extractMetamagicChoices(orianaSources)).toEqual([]);
    expect(extractMetamagicChoices(vivennahSources)).toEqual([]);
  });

  it("builds metamagic traits for chosen options", () => {
    const traits = buildMetamagicTraits(naraSources);
    expect(traits).toHaveLength(2);

    const subtleTrait = traits.find((t) => t.name === "Subtle Spell");
    expect(subtleTrait).toBeDefined();
    expect(subtleTrait!.description).toContain("verbal or somatic");
    expect(subtleTrait!.description).toContain("1 Sorcery Point");
    expect(subtleTrait!.tags).toContain("metamagic");
    expect(subtleTrait!.tags).toContain("no-components");

    const twinnedTrait = traits.find((t) => t.name === "Twinned Spell");
    expect(twinnedTrait).toBeDefined();
    expect(twinnedTrait!.description).toContain("second creature");
    expect(twinnedTrait!.tags).toContain("metamagic");
    expect(twinnedTrait!.tags).toContain("target-duplication");
  });

  it("computes metamagic costs correctly", () => {
    expect(getMetamagicCost("Subtle Spell")).toBe(1);
    expect(getMetamagicCost("Quickened Spell")).toBe(2);
    expect(getMetamagicCost("Heightened Spell")).toBe(3);
  });

  it("Twinned Spell cost scales with spell level", () => {
    expect(getMetamagicCost("Twinned Spell", 0)).toBe(1); // cantrip = 1 minimum
    expect(getMetamagicCost("Twinned Spell", 1)).toBe(1);
    expect(getMetamagicCost("Twinned Spell", 3)).toBe(3);
    expect(getMetamagicCost("Twinned Spell", 5)).toBe(5);
  });

  it("returns null for unknown metamagic option", () => {
    expect(getMetamagicCost("Nonexistent Spell")).toBeNull();
  });

  it("Metamagic trait appears in computed state", () => {
    const state = computeCharacterState(naraInput);
    const metamagicTrait = state.traits.find((t) => t.name === "Metamagic");
    expect(metamagicTrait).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// getClassLevel helper
// ---------------------------------------------------------------------------

describe("getClassLevel", () => {
  it("extracts warlock level from Oriana sources", () => {
    expect(getClassLevel(orianaSources, "warlock")).toBe(2);
  });

  it("extracts bard level from Vivennah sources", () => {
    expect(getClassLevel(vivennahSources, "bard")).toBe(2);
  });

  it("extracts sorcerer level from Nara sources", () => {
    expect(getClassLevel(naraSources, "sorcerer")).toBe(2);
  });

  it("returns 0 for absent class", () => {
    expect(getClassLevel(orianaSources, "bard")).toBe(0);
    expect(getClassLevel(vivennahSources, "warlock")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildCasterClassFeatureEffects — aggregate
// ---------------------------------------------------------------------------

describe("buildCasterClassFeatureEffects", () => {
  it("produces Bardic Inspiration die trait for Vivennah", () => {
    const envelopes = buildCasterClassFeatureEffects(
      vivennahSources,
    );
    const dieTrait = envelopes.find(
      (e) =>
        e.effect.type === "grant-trait" &&
        e.effect.trait.name === "Bardic Inspiration Die",
    );
    expect(dieTrait).toBeDefined();
  });

  it("produces metamagic traits for Nara", () => {
    const envelopes = buildCasterClassFeatureEffects(
      naraSources,
    );
    const metamagicEnvelopes = envelopes.filter(
      (e) =>
        e.effect.type === "grant-trait" &&
        e.sourceName === "Metamagic",
    );
    expect(metamagicEnvelopes).toHaveLength(2);
  });

  it("returns empty array for characters without caster class features", () => {
    const plainSources: SourceWithEffects[] = [
      {
        source: { id: "c", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
    ];
    const envelopes = buildCasterClassFeatureEffects(
      plainSources,
    );
    expect(envelopes).toHaveLength(0);
  });
});
