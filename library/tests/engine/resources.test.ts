import { describe, expect, it } from "vitest";
import {
  buildResourcePoolDefinitions,
  computeCharacterState,
  getPoolsForRestType,
} from "../../src/index.ts";
import type {
  CharacterComputationInput,
  ResourcePoolDefinition,
} from "../../src/types/character.ts";
import type { EffectEnvelope } from "../../src/engine/shared.ts";

// --- Fixtures based on roster characters ---

/**
 * Ronan Wildspark — Fighter 2
 * Has Second Wind (1/short rest) as a fixed resource pool.
 */
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
    {
      source: {
        id: "species-goliath",
        kind: "species",
        name: "Goliath",
      },
      effects: [
        {
          type: "grant-resource",
          resource: { name: "Stone's Endurance", maxUses: 1, resetOn: "short" },
        },
      ],
    },
  ],
  xpLedger: [],
};

/**
 * Vivennah — Bard 2
 * Has Bardic Inspiration (CHA mod = 3 uses, long rest).
 */
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
  ],
  xpLedger: [],
};

/**
 * Nara — Sorcerer 2
 * Has Sorcery Points (2 = sorcerer level, long rest) as a scaling resource.
 */
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
  sources: [
    {
      source: {
        id: "class-level-sorcerer",
        kind: "class-level",
        name: "Sorcerer 2",
        rank: 2,
      },
      effects: [
        {
          type: "grant-scaling-resource",
          resource: {
            name: "Sorcery Points",
            baseUses: 0,
            mode: "proficiency-bonus",
            bonus: 0,
            minimum: 1,
            resetOn: "long",
          },
        },
      ],
    },
  ],
  xpLedger: [],
};

// --- Tests ---

describe("buildResourcePoolDefinitions", () => {
  it("computes fixed resource pool for Fighter (Second Wind, short rest)", () => {
    const state = computeCharacterState(ronanInput);
    const effects: EffectEnvelope[] = ronanInput.sources.flatMap(({ source, effects: effs }) =>
      effs.map((effect) => ({
        sourceName: source.name,
        sourceDescription: source.description,
        effect,
      }))
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      ronanInput.base.abilityScores,
      state.proficiencyBonus,
    );

    expect(pools).toHaveLength(2);

    const secondWind = pools.find((p) => p.resourceName === "Second Wind");
    expect(secondWind).toBeDefined();
    expect(secondWind!.maxUses).toBe(1);
    expect(secondWind!.resetOn).toBe("short");
    expect(secondWind!.sourceName).toBe("Fighter 2");

    const stonesEndurance = pools.find((p) => p.resourceName === "Stone's Endurance");
    expect(stonesEndurance).toBeDefined();
    expect(stonesEndurance!.maxUses).toBe(1);
    expect(stonesEndurance!.resetOn).toBe("short");
    expect(stonesEndurance!.sourceName).toBe("Goliath");
  });

  it("computes fixed resource pool for Bard (Bardic Inspiration, long rest)", () => {
    const state = computeCharacterState(vivennahInput);
    const effects: EffectEnvelope[] = vivennahInput.sources.flatMap(({ source, effects: effs }) =>
      effs.map((effect) => ({
        sourceName: source.name,
        sourceDescription: source.description,
        effect,
      }))
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      vivennahInput.base.abilityScores,
      state.proficiencyBonus,
    );

    expect(pools).toHaveLength(1);
    const bardicPool = pools[0]!;
    expect(bardicPool.resourceName).toBe("Bardic Inspiration");
    expect(bardicPool.maxUses).toBe(3);
    expect(bardicPool.resetOn).toBe("long");
    expect(bardicPool.sourceName).toBe("Bard 2");
  });

  it("computes scaling resource pool for Sorcerer (Sorcery Points, proficiency-bonus mode)", () => {
    const state = computeCharacterState(naraInput);
    const effects: EffectEnvelope[] = naraInput.sources.flatMap(({ source, effects: effs }) =>
      effs.map((effect) => ({
        sourceName: source.name,
        sourceDescription: source.description,
        effect,
      }))
    );

    const pools = buildResourcePoolDefinitions(
      effects,
      naraInput.base.abilityScores,
      state.proficiencyBonus,
    );

    expect(pools).toHaveLength(1);
    const sorceryPool = pools[0]!;
    expect(sorceryPool.resourceName).toBe("Sorcery Points");
    // Level 2 = proficiency bonus 2, baseUses=0 + 2 + 0 = 2
    expect(sorceryPool.maxUses).toBe(2);
    expect(sorceryPool.resetOn).toBe("long");
    expect(sorceryPool.sourceName).toBe("Sorcerer 2");
  });
});

describe("getPoolsForRestType", () => {
  const mixedPools: ResourcePoolDefinition[] = [
    { resourceName: "Second Wind", maxUses: 1, resetOn: "short", sourceName: "Fighter 2" },
    { resourceName: "Stone's Endurance", maxUses: 1, resetOn: "short", sourceName: "Goliath" },
    { resourceName: "Bardic Inspiration", maxUses: 3, resetOn: "long", sourceName: "Bard 2" },
    { resourceName: "Sorcery Points", maxUses: 2, resetOn: "long", sourceName: "Sorcerer 2" },
  ];

  it("short rest returns only short-rest pools", () => {
    const shortRestPools = getPoolsForRestType(mixedPools, "short");
    expect(shortRestPools).toHaveLength(2);
    expect(shortRestPools.map((p) => p.resourceName)).toEqual([
      "Second Wind",
      "Stone's Endurance",
    ]);
  });

  it("long rest returns all pools (superset of short rest)", () => {
    const longRestPools = getPoolsForRestType(mixedPools, "long");
    expect(longRestPools).toHaveLength(4);
  });
});

describe("roster character short/long rest recovery", () => {
  it("Ronan (Fighter) proves short-rest recovery — Second Wind resets on short rest", () => {
    const state = computeCharacterState(ronanInput);

    // Verify Second Wind appears in computed resources
    const secondWind = state.resources.find((r) => r.name === "Second Wind");
    expect(secondWind).toBeDefined();
    expect(secondWind!.maxUses).toBe(1);
    expect(secondWind!.resetOn).toBe("short");

    // Build pool definitions
    const effects: EffectEnvelope[] = ronanInput.sources.flatMap(({ source, effects: effs }) =>
      effs.map((effect) => ({
        sourceName: source.name,
        sourceDescription: source.description,
        effect,
      }))
    );
    const pools = buildResourcePoolDefinitions(effects, ronanInput.base.abilityScores, state.proficiencyBonus);
    const shortRestPools = getPoolsForRestType(pools, "short");

    // Second Wind should be in short rest pools
    expect(shortRestPools.find((p) => p.resourceName === "Second Wind")).toBeDefined();
    // Stone's Endurance also resets on short rest
    expect(shortRestPools.find((p) => p.resourceName === "Stone's Endurance")).toBeDefined();
  });

  it("Vivennah (Bard) proves long-rest recovery — Bardic Inspiration resets on long rest", () => {
    const state = computeCharacterState(vivennahInput);

    // Verify Bardic Inspiration appears in computed resources
    const bardicInspiration = state.resources.find((r) => r.name === "Bardic Inspiration");
    expect(bardicInspiration).toBeDefined();
    expect(bardicInspiration!.maxUses).toBe(3);
    expect(bardicInspiration!.resetOn).toBe("long");

    // Build pool definitions
    const effects: EffectEnvelope[] = vivennahInput.sources.flatMap(({ source, effects: effs }) =>
      effs.map((effect) => ({
        sourceName: source.name,
        sourceDescription: source.description,
        effect,
      }))
    );
    const pools = buildResourcePoolDefinitions(effects, vivennahInput.base.abilityScores, state.proficiencyBonus);

    // Short rest should NOT reset Bardic Inspiration
    const shortRestPools = getPoolsForRestType(pools, "short");
    expect(shortRestPools.find((p) => p.resourceName === "Bardic Inspiration")).toBeUndefined();

    // Long rest should reset Bardic Inspiration
    const longRestPools = getPoolsForRestType(pools, "long");
    expect(longRestPools.find((p) => p.resourceName === "Bardic Inspiration")).toBeDefined();
  });
});
