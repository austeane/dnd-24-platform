import { describe, expect, it } from "vitest";
import {
  buildAlertInitiativeModifier,
  buildFeatAndSpeciesDynamicEffects,
  buildMagicInitiateEffects,
  buildResourcePoolDefinitions,
  buildSavageAttackerTrait,
  buildSkilledProficiencies,
  computeCharacterState,
  getBardicInspirationResetType,
  hasDrowDancingLights,
  hasDrowFaerieFireFreeCast,
  hasDrowFeyAncestry,
  hasMusicianFeat,
  hasStoneEndurance,
  hasWoodElfDruidcraft,
  hasWoodElfSpeedBonus,
  hasWoodElfTrance,
  stonesEnduranceReduction,
} from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";
import type { SourceWithEffects } from "../../src/types/effect.ts";
import type { EffectEnvelope } from "../../src/engine/shared.ts";

// ---------------------------------------------------------------------------
// Roster Fixtures
// ---------------------------------------------------------------------------

/**
 * Ronan Wildspark — Fighter 2, Goliath, Savage Attacker
 */
const ronanSources: SourceWithEffects[] = [
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
    ],
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
      {
        type: "grant-action",
        action: {
          name: "Stone's Endurance",
          timing: "reaction",
          description:
            "When you take damage, roll 1d12 and add Constitution to reduce the damage.",
        },
      },
      {
        type: "grant-scaling-resource",
        resource: {
          name: "Stone's Endurance",
          baseUses: 0,
          mode: "proficiency-bonus",
          minimum: 1,
          resetOn: "long",
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Giant Ancestry",
          description:
            "You inherit one giant-themed supernatural boon. This entry models Stone's Endurance.",
        },
      },
    ],
  },
  {
    source: {
      id: "feat-savage-attacker",
      kind: "feat",
      name: "Savage Attacker",
      entityId: "feat:savage-attacker",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-trait",
        trait: {
          name: "Savage Attacker",
          description:
            "Once per turn when you hit with a weapon, you can roll the weapon's damage dice twice and use either roll.",
        },
      },
    ],
  },
];

const ronanInput: CharacterComputationInput = {
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
  sources: ronanSources,
  xpLedger: [],
};

/**
 * Oriana — Warlock 2, Drow, Skilled
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
      id: "species-drow",
      kind: "species",
      name: "Drow",
      entityId: "species:drow",
      packId: "srd-5e-2024",
    },
    effects: [
      { type: "grant-sense", sense: { sense: "Darkvision", range: 120 } },
      {
        type: "grant-spell-access",
        spell: {
          spellName: "Dancing Lights",
          spellEntityId: "spell-dancing-lights",
          spellPackId: "srd-5e-2024",
          alwaysPrepared: true,
          source: "Drow Lineage",
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Fey Ancestry",
          description:
            "You have advantage on saving throws you make to avoid or end the Charmed condition.",
          tags: ["advantage-vs-charmed"],
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Trance",
          description:
            "You do not need to sleep, magic cannot put you to sleep, and you can finish a Long Rest in 4 hours of meditation.",
          tags: ["4-hour-long-rest"],
        },
      },
      {
        type: "grant-spell-access",
        spell: {
          spellName: "Faerie Fire",
          spellEntityId: "spell-faerie-fire",
          spellPackId: "srd-5e-2024",
          alwaysPrepared: true,
          source: "Drow Lineage",
        },
      },
      {
        type: "grant-resource",
        resource: {
          name: "Drow Faerie Fire Free Cast",
          maxUses: 1,
          resetOn: "long",
        },
      },
    ],
  },
  {
    source: {
      id: "feat-skilled",
      kind: "feat",
      name: "Skilled",
      entityId: "feat:skilled",
      packId: "srd-5e-2024",
      payload: {
        subChoicesJson: {
          skillProficiencies: ["Perception", "Persuasion", "Stealth"],
        },
      },
    },
    effects: [
      {
        type: "grant-trait",
        trait: {
          name: "Skilled",
          description:
            "Choose any combination of three skills or tools to become proficient with.",
        },
      },
    ],
  },
];

const orianaInput: CharacterComputationInput = {
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
    effects: [
      {
        type: "grant-resource",
        resource: { name: "Bardic Inspiration", maxUses: 3, resetOn: "long" },
      },
      {
        type: "grant-action",
        action: {
          name: "Bardic Inspiration",
          timing: "bonus-action",
          description: "Give an ally a d6 inspiration die.",
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
      { type: "grant-sense", sense: { sense: "Darkvision", range: 60 } },
      {
        type: "grant-spell-access",
        spell: {
          spellName: "Druidcraft",
          spellEntityId: "spell-druidcraft",
          spellPackId: "srd-5e-2024",
          alwaysPrepared: true,
          source: "Wood Elf Lineage",
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Fey Ancestry",
          description:
            "You have advantage on saving throws you make to avoid or end the Charmed condition.",
          tags: ["advantage-vs-charmed"],
        },
      },
      {
        type: "grant-trait",
        trait: {
          name: "Trance",
          description:
            "You do not need to sleep, magic cannot put you to sleep, and you can finish a Long Rest in 4 hours of meditation.",
          tags: ["4-hour-long-rest"],
        },
      },
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

const vivennahInput: CharacterComputationInput = {
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
        type: "grant-trait",
        trait: {
          name: "Magic Initiate",
          description:
            "You learn two cantrips and one level 1 spell from a chosen class's spell list.",
          tags: ["choice-capture", "free-cast-tracking"],
        },
      },
      {
        type: "grant-resource",
        resource: {
          name: "Magic Initiate Free Cast",
          maxUses: 1,
          resetOn: "long",
        },
      },
    ],
  },
];

const naraInput: CharacterComputationInput = {
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
    spellcastingAbility: "charisma",
  },
  sources: naraSources,
  xpLedger: [],
};

// ---------------------------------------------------------------------------
// Alert feat — initiative bonus
// ---------------------------------------------------------------------------

describe("Alert feat — initiative bonus", () => {
  const alertSources: SourceWithEffects[] = [
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
        id: "feat-alert",
        kind: "feat",
        name: "Alert",
        entityId: "feat:alert",
        packId: "srd-5e-2024",
      },
      effects: [
        {
          type: "grant-trait",
          trait: {
            name: "Alert",
            description:
              "You add your Proficiency Bonus to initiative rolls.",
            tags: ["initiative-proficiency-bonus"],
          },
        },
      ],
    },
  ];

  it("produces initiative modifier equal to proficiency bonus", () => {
    const effect = buildAlertInitiativeModifier(alertSources, 2);
    expect(effect).not.toBeNull();
    expect(effect!.type).toBe("modifier");
    if (effect!.type === "modifier") {
      expect(effect!.target).toBe("initiative");
      expect(effect!.value).toBe(2);
    }
  });

  it("scales with proficiency bonus at higher levels", () => {
    const effect = buildAlertInitiativeModifier(alertSources, 4);
    expect(effect).not.toBeNull();
    if (effect!.type === "modifier") {
      expect(effect!.value).toBe(4);
    }
  });

  it("returns null when character lacks Alert", () => {
    const noAlert: SourceWithEffects[] = [
      {
        source: { id: "class", kind: "class-level", name: "Bard 2", rank: 2 },
        effects: [],
      },
    ];
    expect(buildAlertInitiativeModifier(noAlert, 2)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Savage Attacker — damage reroll surface
// ---------------------------------------------------------------------------

describe("Savage Attacker — Ronan Wildspark", () => {
  it("surfaces the Savage Attacker reroll trait for Ronan", () => {
    const trait = buildSavageAttackerTrait(ronanSources);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Savage Attacker");
    expect(trait!.tags).toContain("once-per-turn");
    expect(trait!.tags).toContain("melee-damage-reroll");
    expect(trait!.sourceName).toBe("Savage Attacker");
  });

  it("returns null when character lacks Savage Attacker", () => {
    expect(buildSavageAttackerTrait(orianaSources)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Goliath — Stone's Endurance
// ---------------------------------------------------------------------------

describe("Goliath Stone's Endurance — Ronan Wildspark", () => {
  it("detects Stone's Endurance scaling resource", () => {
    expect(hasStoneEndurance(ronanSources)).toBe(true);
  });

  it("computes Stone's Endurance resource pool (PB uses/long rest at level 2)", () => {
    const state = computeCharacterState(ronanInput);
    const effects: EffectEnvelope[] = ronanSources.flatMap(
      ({ source, effects: effs }) =>
        effs.map((effect) => ({
          sourceName: source.name,
          sourceDescription: source.description,
          effect,
        })),
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      ronanInput.base.abilityScores,
      state.proficiencyBonus,
    );
    const stonesPool = pools.find(
      (p) => p.resourceName === "Stone's Endurance",
    );

    expect(stonesPool).toBeDefined();
    // PB at level 2 = 2; baseUses=0 + PB=2 = 2 uses
    expect(stonesPool!.maxUses).toBe(2);
    expect(stonesPool!.resetOn).toBe("long");
  });

  it("computes reduction dice string (1d12+CON)", () => {
    const reduction = stonesEnduranceReduction(ronanInput.base.abilityScores);
    // CON 15 = +2 modifier
    expect(reduction).toBe("1d12+2");
  });

  it("Stone's Endurance appears as a reaction action", () => {
    const state = computeCharacterState(ronanInput);
    const action = state.actions.find((a) => a.name === "Stone's Endurance");
    expect(action).toBeDefined();
    expect(action!.timing).toBe("reaction");
  });
});

// ---------------------------------------------------------------------------
// Drow — lineage spells and Fey Ancestry (Oriana)
// ---------------------------------------------------------------------------

describe("Drow species mechanics — Oriana", () => {
  it("detects Drow Dancing Lights cantrip", () => {
    expect(hasDrowDancingLights(orianaSources)).toBe(true);
  });

  it("detects Drow Faerie Fire free cast resource", () => {
    expect(hasDrowFaerieFireFreeCast(orianaSources)).toBe(true);
  });

  it("detects Drow Fey Ancestry trait", () => {
    expect(hasDrowFeyAncestry(orianaSources)).toBe(true);
  });

  it("Darkvision 120 ft appears in computed senses", () => {
    const state = computeCharacterState(orianaInput);
    const dv = state.senses.find((s) => s.sense === "Darkvision");
    expect(dv).toBeDefined();
    expect(dv!.range).toBe(120);
  });

  it("Fey Ancestry and Trance appear as traits", () => {
    const state = computeCharacterState(orianaInput);
    expect(state.traits.find((t) => t.name === "Fey Ancestry")).toBeDefined();
    expect(state.traits.find((t) => t.name === "Trance")).toBeDefined();
  });

  it("Faerie Fire free cast resource pool has 1 use/long rest", () => {
    const state = computeCharacterState(orianaInput);
    const effects: EffectEnvelope[] = orianaSources.flatMap(
      ({ source, effects: effs }) =>
        effs.map((effect) => ({
          sourceName: source.name,
          sourceDescription: source.description,
          effect,
        })),
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      orianaInput.base.abilityScores,
      state.proficiencyBonus,
    );
    const ffPool = pools.find(
      (p) => p.resourceName === "Drow Faerie Fire Free Cast",
    );

    expect(ffPool).toBeDefined();
    expect(ffPool!.maxUses).toBe(1);
    expect(ffPool!.resetOn).toBe("long");
  });
});

// ---------------------------------------------------------------------------
// Skilled — proficiency choice capture (Oriana)
// ---------------------------------------------------------------------------

describe("Skilled feat — Oriana", () => {
  it("extracts proficiency effects from sub-choices payload", () => {
    const effects = buildSkilledProficiencies(orianaSources);
    expect(effects).toHaveLength(3);
    const skills = effects
      .filter((e) => e.type === "proficiency" && e.category === "skill")
      .map((e) => {
        if (e.type === "proficiency") return e.value;
        return "";
      });
    expect(skills).toContain("Perception");
    expect(skills).toContain("Persuasion");
    expect(skills).toContain("Stealth");
  });

  it("returns empty array when character has no Skilled feat", () => {
    expect(buildSkilledProficiencies(vivennahSources)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Wood Elf — speed, Druidcraft, Trance (Vivennah)
// ---------------------------------------------------------------------------

describe("Wood Elf species mechanics — Vivennah", () => {
  it("detects +5 walking speed bonus", () => {
    expect(hasWoodElfSpeedBonus(vivennahSources)).toBe(true);
  });

  it("speed bonus is reflected in computed state", () => {
    const state = computeCharacterState(vivennahInput);
    // baseSpeed 30 + 5 wood elf bonus = 35
    expect(state.speed).toBe(35);
  });

  it("detects Druidcraft cantrip access", () => {
    expect(hasWoodElfDruidcraft(vivennahSources)).toBe(true);
  });

  it("detects Trance trait (4-hour long rest)", () => {
    expect(hasWoodElfTrance(vivennahSources)).toBe(true);
  });

  it("Darkvision 60 ft appears in computed senses", () => {
    const state = computeCharacterState(vivennahInput);
    const dv = state.senses.find((s) => s.sense === "Darkvision");
    expect(dv).toBeDefined();
    expect(dv!.range).toBe(60);
  });

  it("Fey Ancestry and Trance appear as traits", () => {
    const state = computeCharacterState(vivennahInput);
    expect(state.traits.find((t) => t.name === "Fey Ancestry")).toBeDefined();
    expect(state.traits.find((t) => t.name === "Trance")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Musician — short rest Bardic Inspiration recovery (Vivennah)
// ---------------------------------------------------------------------------

describe("Musician feat — Vivennah", () => {
  it("detects Musician feat presence", () => {
    expect(hasMusicianFeat(vivennahSources)).toBe(true);
  });

  it("Musician changes Bardic Inspiration reset type to short rest", () => {
    expect(getBardicInspirationResetType(vivennahSources)).toBe("short");
  });

  it("without Musician, Bardic Inspiration resets on long rest only", () => {
    const sourcesWithoutMusician = vivennahSources.filter(
      (s) => s.source.kind !== "feat",
    );
    expect(getBardicInspirationResetType(sourcesWithoutMusician)).toBe("long");
  });

  it("Musician trait surfaces in computed state", () => {
    const state = computeCharacterState(vivennahInput);
    const musicianTrait = state.traits.find((t) => t.name === "Musician");
    expect(musicianTrait).toBeDefined();
    expect(musicianTrait!.tags).toContain("short-rest-benefit");
  });
});

// ---------------------------------------------------------------------------
// Magic Initiate — choice capture + free cast (Nara)
// ---------------------------------------------------------------------------

describe("Magic Initiate feat — Nara", () => {
  it("builds spell access effects from sub-choices payload", () => {
    const effects = buildMagicInitiateEffects(naraSources);
    expect(effects.length).toBeGreaterThanOrEqual(3);

    const spellNames = effects
      .filter((e) => e.type === "grant-spell-access")
      .map((e) => {
        if (e.type === "grant-spell-access") return e.spell.spellName;
        return "";
      });
    expect(spellNames).toContain("Fire Bolt");
    expect(spellNames).toContain("Mage Hand");
    expect(spellNames).toContain("Shield");
  });

  it("free cast resource appears in computed resource pools", () => {
    const state = computeCharacterState(naraInput);
    const effects: EffectEnvelope[] = naraSources.flatMap(
      ({ source, effects: effs }) =>
        effs.map((effect) => ({
          sourceName: source.name,
          sourceDescription: source.description,
          effect,
        })),
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      naraInput.base.abilityScores,
      state.proficiencyBonus,
    );
    const freeCastPool = pools.find(
      (p) => p.resourceName === "Magic Initiate Free Cast",
    );

    expect(freeCastPool).toBeDefined();
    expect(freeCastPool!.maxUses).toBe(1);
    expect(freeCastPool!.resetOn).toBe("long");
  });

  it("returns empty effects when sub-choices are not populated", () => {
    const minimalSources: SourceWithEffects[] = [
      {
        source: {
          id: "feat-mi",
          kind: "feat",
          name: "Magic Initiate (Wizard)",
          entityId: "feat:magic-initiate",
        },
        effects: [],
      },
    ];
    expect(buildMagicInitiateEffects(minimalSources)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildFeatAndSpeciesDynamicEffects — aggregate
// ---------------------------------------------------------------------------

describe("buildFeatAndSpeciesDynamicEffects", () => {
  it("produces Alert initiative modifier in dynamic effects", () => {
    const alertSources: SourceWithEffects[] = [
      {
        source: { id: "c", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
      {
        source: {
          id: "f",
          kind: "feat",
          name: "Alert",
          entityId: "feat:alert",
        },
        effects: [],
      },
    ];

    const envelopes = buildFeatAndSpeciesDynamicEffects(alertSources, 2);
    const initiativeEffect = envelopes.find(
      (e) =>
        e.effect.type === "modifier" &&
        e.effect.target === "initiative",
    );

    expect(initiativeEffect).toBeDefined();
    if (initiativeEffect!.effect.type === "modifier") {
      expect(initiativeEffect!.effect.value).toBe(2);
    }
  });

  it("produces Skilled proficiency effects in dynamic effects", () => {
    const envelopes = buildFeatAndSpeciesDynamicEffects(orianaSources, 2);
    const skillEffects = envelopes.filter(
      (e) => e.effect.type === "proficiency",
    );
    expect(skillEffects).toHaveLength(3);
  });

  it("produces Magic Initiate spell access in dynamic effects", () => {
    const envelopes = buildFeatAndSpeciesDynamicEffects(naraSources, 2);
    const spellEffects = envelopes.filter(
      (e) => e.effect.type === "grant-spell-access",
    );
    expect(spellEffects).toHaveLength(3);
  });

  it("returns empty array when no relevant feats are present", () => {
    const plainSources: SourceWithEffects[] = [
      {
        source: { id: "c", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
    ];
    const envelopes = buildFeatAndSpeciesDynamicEffects(plainSources, 2);
    expect(envelopes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tali — reviewed custom lineage preservation
// ---------------------------------------------------------------------------

describe("Tali — reviewed custom lineage", () => {
  const taliSources: SourceWithEffects[] = [
    {
      source: {
        id: "sheet-species-magic",
        kind: "species",
        name: "Sheet Species Magic",
        entityId: "seed:species:sheet-species-magic",
      },
      effects: [
        {
          type: "grant-sense",
          sense: { sense: "Darkvision", range: 60 },
        },
        {
          type: "grant-trait",
          trait: {
            name: "Feerie Tollen",
            description:
              "Reviewed sheet note: bonus-action telepathic message and remote viewing.",
          },
        },
        {
          type: "grant-trait",
          trait: {
            name: "Hex Magic",
            description:
              "Reviewed sheet note: species-origin magic includes Disguise Self and Hex.",
          },
        },
      ],
    },
  ];

  it("Tali's custom species traits are preserved as-is", () => {
    const input: CharacterComputationInput = {
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
        baseArmorClass: 13,
        baseMaxHP: 19,
        baseSpeed: 30,
        spellcastingAbility: "wisdom",
      },
      sources: taliSources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);

    // Species traits should be present
    expect(state.traits.find((t) => t.name === "Feerie Tollen")).toBeDefined();
    expect(state.traits.find((t) => t.name === "Hex Magic")).toBeDefined();

    // Darkvision should be present
    const dv = state.senses.find((s) => s.sense === "Darkvision");
    expect(dv).toBeDefined();
    expect(dv!.range).toBe(60);
  });

  it("custom lineage is not recognized by standard species checks", () => {
    expect(hasStoneEndurance(taliSources)).toBe(false);
    expect(hasWoodElfSpeedBonus(taliSources)).toBe(false);
    expect(hasDrowFeyAncestry(taliSources)).toBe(false);
  });
});
