/**
 * Fixture-roster snapshot assertions.
 *
 * These tests use the fixture-patterns pipeline to build CharacterComputationInput
 * for each roster character, then assert specific mechanic outputs that prove the
 * engine correctly computes attack profiles, weapon mastery, spell capacities,
 * and expertise grants.
 *
 * Each describe block maps to one or more atomic mechanic IDs in the coverage tracker.
 */
import { describe, expect, it } from "vitest";
import {
  computeCharacterState,
  computePreparedSpellCapacity,
  getKnownSpellCount,
} from "../../src/index.ts";
import {
  buildCharacterFixture,
  loadVerifiedRoster,
} from "../../../data/fleet/fixture-patterns.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";
import type { SourceWithEffects } from "../../src/types/effect.ts";

const roster = loadVerifiedRoster();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fixtureState(slug: string) {
  return computeCharacterState(buildCharacterFixture(roster, slug));
}

// ---------------------------------------------------------------------------
// Melee attack profiles (action-melee-attack-profiles)
// ---------------------------------------------------------------------------

describe("fixture-roster: melee attack profiles", () => {
  it("Ronan: Longsword melee profile with STR ability and slashing damage", () => {
    const state = fixtureState("ronan-wildspark");
    const longsword = state.attackProfiles.find(
      (a) => a.name === "Longsword" && a.attackType === "melee",
    );

    expect(longsword).toBeDefined();
    expect(longsword!.ability).toBe("strength");
    expect(longsword!.damageDice).toBe("1d8");
    expect(longsword!.damageType).toBe("slashing");
    expect(longsword!.attackType).toBe("melee");
    expect(longsword!.properties).toContain("Versatile (1d10)");
  });

  it("Tali: Quarterstaff melee profile with STR ability and bludgeoning damage", () => {
    const state = fixtureState("tali");
    const quarterstaff = state.attackProfiles.find(
      (a) => a.name === "Quarterstaff" && a.attackType === "melee",
    );

    expect(quarterstaff).toBeDefined();
    expect(quarterstaff!.ability).toBe("strength");
    expect(quarterstaff!.damageDice).toBe("1d6");
    expect(quarterstaff!.damageType).toBe("bludgeoning");
    expect(quarterstaff!.attackType).toBe("melee");
    expect(quarterstaff!.properties).toContain("Versatile (1d8)");
  });

  it("Vivennah: Rapier melee profile uses DEX (finesse, DEX > STR)", () => {
    const state = fixtureState("vivennah");
    const rapier = state.attackProfiles.find(
      (a) => a.name === "Rapier" && a.attackType === "melee",
    );

    expect(rapier).toBeDefined();
    expect(rapier!.ability).toBe("dexterity");
    expect(rapier!.damageDice).toBe("1d8");
    expect(rapier!.damageType).toBe("piercing");
    expect(rapier!.attackType).toBe("melee");
    expect(rapier!.properties).toContain("Finesse");
  });

  it("Nara: no melee attack profiles (no equipped weapons)", () => {
    const state = fixtureState("nara");
    const melee = state.attackProfiles.filter((a) => a.attackType === "melee");
    expect(melee).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Ranged attack profiles (action-ranged-attack-profiles)
// ---------------------------------------------------------------------------

describe("fixture-roster: ranged attack profiles", () => {
  it("Ronan: no ranged attack profiles (only Longsword equipped, no thrown weapons)", () => {
    const state = fixtureState("ronan-wildspark");
    const ranged = state.attackProfiles.filter((a) => a.attackType === "ranged");
    expect(ranged).toHaveLength(0);
  });

  it("Nara: no ranged attack profiles (no equipment)", () => {
    const state = fixtureState("nara");
    const ranged = state.attackProfiles.filter((a) => a.attackType === "ranged");
    expect(ranged).toHaveLength(0);
  });

  it("standalone ranged weapon: Longbow uses DEX and has range", () => {
    // Build a minimal fixture with a longbow to prove ranged derivation
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
        name: "Archer Fixture",
        progressionMode: "hybrid",
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
    const longbow = state.attackProfiles.find((a) => a.name === "Longbow");

    expect(longbow).toBeDefined();
    expect(longbow!.attackType).toBe("ranged");
    expect(longbow!.ability).toBe("dexterity");
    expect(longbow!.range).toBe("150/600");
    expect(longbow!.damageDice).toBe("1d8");
    expect(longbow!.damageType).toBe("piercing");
  });
});

// ---------------------------------------------------------------------------
// Damage package projection (action-damage-package-projection)
// ---------------------------------------------------------------------------

describe("fixture-roster: damage package projection", () => {
  it("Ronan Longsword: damage dice 1d8, bonus from STR, type slashing", () => {
    const state = fixtureState("ronan-wildspark");
    const longsword = state.attackProfiles.find((a) => a.name === "Longsword");

    expect(longsword).toBeDefined();
    expect(longsword!.damageDice).toBe("1d8");
    // STR 13 -> +1 modifier
    expect(longsword!.damageBonus).toBe(1);
    expect(longsword!.damageType).toBe("slashing");
  });

  it("Tali Quarterstaff: damage dice 1d6, negative bonus from STR, type bludgeoning", () => {
    const state = fixtureState("tali");
    const quarterstaff = state.attackProfiles.find((a) => a.name === "Quarterstaff");

    expect(quarterstaff).toBeDefined();
    expect(quarterstaff!.damageDice).toBe("1d6");
    // STR 8 -> -1 modifier
    expect(quarterstaff!.damageBonus).toBe(-1);
    expect(quarterstaff!.damageType).toBe("bludgeoning");
  });

  it("Vivennah Rapier: damage dice 1d8, bonus from DEX (finesse), type piercing", () => {
    const state = fixtureState("vivennah");
    const rapier = state.attackProfiles.find((a) => a.name === "Rapier");

    expect(rapier).toBeDefined();
    expect(rapier!.damageDice).toBe("1d8");
    // DEX 18 -> +4 modifier (finesse uses DEX when higher)
    expect(rapier!.damageBonus).toBe(4);
    expect(rapier!.damageType).toBe("piercing");
  });
});

// ---------------------------------------------------------------------------
// Weapon mastery runtime (action-weapon-mastery-runtime)
// ---------------------------------------------------------------------------

describe("fixture-roster: weapon mastery runtime", () => {
  it("Ronan: Longsword has Sap mastery property", () => {
    const state = fixtureState("ronan-wildspark");
    const longsword = state.attackProfiles.find((a) => a.name === "Longsword");

    expect(longsword).toBeDefined();
    expect(longsword!.masteryProperty).toBe("Sap");
  });

  it("Tali: Quarterstaff has no mastery (Druid has no Weapon Mastery feature)", () => {
    const state = fixtureState("tali");
    const quarterstaff = state.attackProfiles.find((a) => a.name === "Quarterstaff");

    expect(quarterstaff).toBeDefined();
    expect(quarterstaff!.masteryProperty).toBeUndefined();
  });

  it("Vivennah: Rapier has no mastery (Bard has no Weapon Mastery feature)", () => {
    const state = fixtureState("vivennah");
    const rapier = state.attackProfiles.find((a) => a.name === "Rapier");

    expect(rapier).toBeDefined();
    expect(rapier!.masteryProperty).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Prepared spell capacity grants (spell-prepared-capacity-grants)
// ---------------------------------------------------------------------------

describe("fixture-roster: prepared spell capacity grants", () => {
  it("Tali (Druid 2, WIS +3): prepared capacity = level + WIS mod = 5", () => {
    // Druid is a prepared caster: level 2 + WIS modifier +3 = 5
    const capacity = computePreparedSpellCapacity(2, 3);
    expect(capacity).toBe(5);
  });

  it("Tali: spellcasting state exists with correct save DC and attack bonus", () => {
    const state = fixtureState("tali");
    expect(state.spellcasting).not.toBeNull();
    // WIS 17 (+3), proficiency +2 -> save DC = 8 + 3 + 2 = 13, attack = 3 + 2 = 5
    expect(state.spellcasting!.spellSaveDc).toBe(13);
    expect(state.spellcasting!.spellAttackBonus).toBe(5);
  });

  it("prepared capacity enforces minimum of 1", () => {
    // Even with negative modifier, minimum is 1
    const capacity = computePreparedSpellCapacity(1, -3);
    expect(capacity).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Known spell capacity grants (spell-known-capacity-grants)
// ---------------------------------------------------------------------------

describe("fixture-roster: known spell capacity grants", () => {
  it("Vivennah (Bard 2): known spell count = 5", () => {
    const known = getKnownSpellCount("bard", 2);
    expect(known).toBe(5);
  });

  it("Nara (Sorcerer 2): known spell count = 4", () => {
    const known = getKnownSpellCount("sorcerer", 2);
    expect(known).toBe(4);
  });

  it("Oriana (Warlock 2): known spell count = 3", () => {
    const known = getKnownSpellCount("warlock", 2);
    expect(known).toBe(3);
  });

  it("Tali (Druid 2): Druid uses prepared, not known — returns null", () => {
    const known = getKnownSpellCount("druid", 2);
    expect(known).toBeNull();
  });

  it("Vivennah: spellcasting state exists", () => {
    const state = fixtureState("vivennah");
    expect(state.spellcasting).not.toBeNull();
    expect(state.spellcasting!.grantedSpellNames.length).toBeGreaterThan(0);
  });

  it("Nara: spellcasting state exists", () => {
    const state = fixtureState("nara");
    expect(state.spellcasting).not.toBeNull();
  });

  it("Oriana: spellcasting state exists with Pact Magic slots", () => {
    const state = fixtureState("oriana");
    expect(state.spellcasting).not.toBeNull();
    const pactPool = state.spellcasting!.slotPools.find(
      (p) => p.source === "Pact Magic",
    );
    expect(pactPool).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Expertise grants (core-expertise-grants)
// ---------------------------------------------------------------------------

describe("fixture-roster: expertise grants", () => {
  it("no roster characters currently have expertise", () => {
    // Verify the roster baseline: none of the 5 characters have expertise
    for (const slug of ["nara", "oriana", "ronan-wildspark", "tali", "vivennah"] as const) {
      const state = fixtureState(slug);
      const expertiseSkills = state.skillState.skills.filter((s) => s.expertise);
      expect(
        expertiseSkills.length,
        `${state.name} should have no expertise skills`,
      ).toBe(0);
    }
  });

  it("synthetic fixture: expertise doubles proficiency bonus on skill", () => {
    // Build a synthetic fixture to prove expertise works through the full pipeline
    const sources: SourceWithEffects[] = [
      {
        source: {
          id: "class-level-rogue",
          kind: "class-level",
          name: "Rogue 1",
          rank: 1,
        },
        effects: [],
      },
      {
        source: {
          id: "skill-choices",
          kind: "override",
          name: "Skill Proficiencies",
        },
        effects: [
          { type: "proficiency", category: "skill", value: "Stealth" },
          { type: "expertise", skill: "Stealth" },
          { type: "proficiency", category: "skill", value: "Perception" },
        ],
      },
    ];

    const input: CharacterComputationInput = {
      base: {
        name: "Expertise Fixture",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 10,
          dexterity: 16,
          constitution: 10,
          intelligence: 10,
          wisdom: 14,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 10,
        baseSpeed: 30,
      },
      sources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);

    const stealth = state.skillState.skills.find((s) => s.skillName === "Stealth")!;
    expect(stealth.proficient).toBe(true);
    expect(stealth.expertise).toBe(true);
    // DEX +3, proficiency +2, expertise +2 = +7
    expect(stealth.bonus).toBe(7);

    const perception = state.skillState.skills.find((s) => s.skillName === "Perception")!;
    expect(perception.proficient).toBe(true);
    expect(perception.expertise).toBe(false);
    // WIS +2, proficiency +2 = +4
    expect(perception.bonus).toBe(4);
  });

  it("synthetic fixture: expertise on Perception increases passive Perception", () => {
    const sources: SourceWithEffects[] = [
      {
        source: {
          id: "class-level-rogue",
          kind: "class-level",
          name: "Rogue 1",
          rank: 1,
        },
        effects: [],
      },
      {
        source: {
          id: "skill-choices",
          kind: "override",
          name: "Skill Proficiencies",
        },
        effects: [
          { type: "proficiency", category: "skill", value: "Perception" },
          { type: "expertise", skill: "Perception" },
        ],
      },
    ];

    const input: CharacterComputationInput = {
      base: {
        name: "PP Expertise Fixture",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 14,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 10,
        baseSpeed: 30,
      },
      sources,
      xpLedger: [],
    };

    const state = computeCharacterState(input);
    // passive = 10 + WIS +2 + prof 2 + expertise 2 = 16
    expect(state.passivePerception.total).toBe(16);
  });
});
