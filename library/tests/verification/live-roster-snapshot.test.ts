import { describe, expect, it } from "vitest";
import { computeCharacterState } from "../../src/index.ts";
import {
  buildAllCharacterFixtures,
  buildCharacterFixture,
  loadVerifiedRoster,
  rosterSlugs,
} from "../../../data/fleet/fixture-patterns.ts";

const roster = loadVerifiedRoster();

describe("live-roster snapshot computation", () => {
  it("loads all 5 reviewed characters from verified roster", () => {
    const fixtures = buildAllCharacterFixtures(roster);
    expect(fixtures.size).toBe(5);

    for (const slug of rosterSlugs) {
      expect(fixtures.has(slug), `missing fixture for ${slug}`).toBe(true);
    }
  });

  it("computeCharacterState succeeds for all roster characters", () => {
    for (const slug of rosterSlugs) {
      const input = buildCharacterFixture(roster, slug);
      const state = computeCharacterState(input);

      expect(state.name).toBeTruthy();
      expect(state.level).toBeGreaterThanOrEqual(1);
      expect(state.proficiencyBonus).toBeGreaterThanOrEqual(2);
      expect(state.armorClass.total).toBeGreaterThan(0);
      expect(state.maxHP).toBeGreaterThan(0);
    }
  });

  it("computation is deterministic for each character", () => {
    for (const slug of rosterSlugs) {
      const input = buildCharacterFixture(roster, slug);
      const state1 = computeCharacterState(input);
      const state2 = computeCharacterState(input);

      expect(state1.armorClass.total).toBe(state2.armorClass.total);
      expect(state1.maxHP).toBe(state2.maxHP);
      expect(state1.initiative.total).toBe(state2.initiative.total);
      expect(state1.passivePerception.total).toBe(state2.passivePerception.total);
      expect(state1.speed).toBe(state2.speed);
    }
  });

  it("all roster characters have skill proficiencies from choice-state", () => {
    for (const slug of rosterSlugs) {
      const input = buildCharacterFixture(roster, slug);
      const state = computeCharacterState(input);
      const proficientSkills = state.skillState.skills.filter((s) => s.proficient);
      expect(
        proficientSkills.length,
        `${state.name} should have at least one skill proficiency`,
      ).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Ronan Wildspark: Fighter 2 / Goliath
  // -------------------------------------------------------------------------
  it("Ronan Wildspark: Fighter 2, expected sheet-baseline values", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));
    expect(state.name).toBe("Ronan Wildspark");
    expect(state.level).toBe(2);
    expect(state.armorClass.total).toBe(14);
    expect(state.maxHP).toBe(22);
    expect(state.speed).toBe(30);
    expect(state.passivePerception.total).toBe(10);
    expect(state.spellcasting).toBeNull();
  });

  it("Ronan: skill proficiencies from class choices", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));
    const proficientSkills = state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort();
    expect(proficientSkills).toEqual(["Athletics", "Intimidation"]);

    const athletics = state.skillState.skills.find((s) => s.skillName === "Athletics")!;
    expect(athletics.bonus).toBe(3); // STR +1 + prof +2

    const intimidation = state.skillState.skills.find((s) => s.skillName === "Intimidation")!;
    expect(intimidation.bonus).toBe(1); // CHA -1 + prof +2
  });

  it("Ronan: Longsword attack profile with Sap mastery", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));
    const longsword = state.attackProfiles.find((a) => a.name === "Longsword")!;
    expect(longsword).toBeDefined();
    // Longsword uses STR: STR 13 (+1). Proficiency not modeled yet via class weapon prof.
    expect(longsword.ability).toBe("strength");
    expect(longsword.damageDice).toBe("1d8");
    expect(longsword.damageType).toBe("slashing");
    expect(longsword.masteryProperty).toBe("Sap");
    // NOTE: Javelin is not equipped, so no javelin attack profile
  });

  it("Ronan: resources from Goliath and Fighter", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));
    const resourceNames = state.resources.map((r) => r.name).sort();
    expect(resourceNames).toContain("Second Wind");
    expect(resourceNames).toContain("Stone's Endurance");
  });

  // -------------------------------------------------------------------------
  // Tali: Druid 2
  // -------------------------------------------------------------------------
  it("Tali: Druid 2, expected sheet-baseline values", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "tali"));
    expect(state.name).toBe("Tali");
    expect(state.level).toBe(2);
    expect(state.armorClass.total).toBe(13);
    expect(state.maxHP).toBe(19);
    expect(state.passivePerception.total).toBe(13);
    expect(state.spellcasting).not.toBeNull();
    expect(state.spellcasting?.spellSaveDc).toBe(13);
    expect(state.spellcasting?.spellAttackBonus).toBe(5);
  });

  it("Tali: skill proficiencies from class choices", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "tali"));
    const proficientSkills = state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort();
    expect(proficientSkills).toEqual(["Nature", "Perception"]);

    const nature = state.skillState.skills.find((s) => s.skillName === "Nature")!;
    expect(nature.bonus).toBe(4); // INT +2 + prof +2

    const perception = state.skillState.skills.find((s) => s.skillName === "Perception")!;
    expect(perception.bonus).toBe(5); // WIS +3 + prof +2
  });

  it("Tali: Wild Shape resource and spellcasting", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "tali"));
    const resourceNames = state.resources.map((r) => r.name).sort();
    expect(resourceNames).toContain("Wild Shape");

    expect(state.spellcasting?.grantedSpellNames.length).toBeGreaterThan(0);
  });

  it("Tali: Quarterstaff attack profile", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "tali"));
    const quarterstaff = state.attackProfiles.find((a) => a.name === "Quarterstaff")!;
    expect(quarterstaff).toBeDefined();
    expect(quarterstaff.ability).toBe("strength");
    expect(quarterstaff.damageDice).toBe("1d6");
    expect(quarterstaff.damageType).toBe("bludgeoning");
    // NOTE: Class weapon proficiency not yet modeled; isProficient=false
    // so attack bonus = STR -1 only (no prof bonus)
  });

  // -------------------------------------------------------------------------
  // Oriana: Warlock 2 / Drow
  // -------------------------------------------------------------------------
  it("Oriana: Warlock 2, expected sheet-baseline values", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));
    expect(state.name).toBe("Oriana");
    expect(state.level).toBe(2);
    expect(state.armorClass.total).toBe(12);
    expect(state.maxHP).toBe(18);
    expect(state.passivePerception.total).toBe(13);
    expect(state.spellcasting).not.toBeNull();
    expect(state.spellcasting?.spellSaveDc).toBe(13);
  });

  it("Oriana: skill proficiencies from class and Skilled feat", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));
    const proficientSkills = state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort();
    expect(proficientSkills).toEqual([
      "Arcana",
      "Deception",
      "Perception",
      "Persuasion",
      "Stealth",
    ]);

    const arcana = state.skillState.skills.find((s) => s.skillName === "Arcana")!;
    expect(arcana.bonus).toBe(2); // INT +0 + prof +2

    const deception = state.skillState.skills.find((s) => s.skillName === "Deception")!;
    expect(deception.bonus).toBe(5); // CHA +3 + prof +2
  });

  it("Oriana: Pact Magic slot pool on short rest", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));
    expect(state.spellcasting?.slotPools.length).toBeGreaterThan(0);

    const pactPool = state.spellcasting?.slotPools.find((p) => p.source === "Pact Magic");
    expect(pactPool).toBeDefined();
    expect(pactPool?.resetOn).toBe("short");
    expect(pactPool?.slots[0]?.total).toBe(2);
  });

  it("Oriana: Magical Cunning resource", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));
    const resourceNames = state.resources.map((r) => r.name);
    expect(resourceNames).toContain("Magical Cunning");
  });

  it("Oriana: Drow species traits (Darkvision, Fey Ancestry)", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));
    const senseNames = state.senses.map((s) => s.sense);
    expect(senseNames).toContain("Darkvision");

    const traitNames = state.traits.map((t) => t.name);
    expect(traitNames).toContain("Fey Ancestry");
  });

  // -------------------------------------------------------------------------
  // Vivennah: Bard 2 / Wood Elf
  // -------------------------------------------------------------------------
  it("Vivennah: Bard 2, expected sheet-baseline values", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));
    expect(state.name).toBe("Vivennah");
    expect(state.level).toBe(2);
    expect(state.armorClass.total).toBe(13);
    expect(state.maxHP).toBe(15);
    expect(state.speed).toBe(35);
    expect(state.passivePerception.total).toBe(10);
    expect(state.spellcasting).not.toBeNull();
  });

  it("Vivennah: skill proficiencies from class choices", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));
    const proficientSkills = state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort();
    expect(proficientSkills).toEqual(["Acrobatics", "Performance", "Persuasion"]);

    const acrobatics = state.skillState.skills.find((s) => s.skillName === "Acrobatics")!;
    expect(acrobatics.bonus).toBe(6); // DEX +4 + prof +2

    const performance = state.skillState.skills.find((s) => s.skillName === "Performance")!;
    expect(performance.bonus).toBe(5); // CHA +3 + prof +2
  });

  it("Vivennah: Bardic Inspiration resource", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));
    const resourceNames = state.resources.map((r) => r.name);
    expect(resourceNames).toContain("Bardic Inspiration");

    const biResource = state.resources.find((r) => r.name === "Bardic Inspiration")!;
    expect(biResource.maxUses).toBe(3); // CHA +3
  });

  it("Vivennah: Wood Elf speed bonus and Darkvision", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));
    expect(state.speed).toBe(35); // 30 base + 5 Wood Elf

    const senseNames = state.senses.map((s) => s.sense);
    expect(senseNames).toContain("Darkvision");
  });

  it("Vivennah: Rapier attack profile", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));
    const rapier = state.attackProfiles.find((a) => a.name === "Rapier")!;
    expect(rapier).toBeDefined();
    // Rapier is finesse. DEX +4 > STR -1, so uses DEX
    expect(rapier.ability).toBe("dexterity");
    expect(rapier.damageDice).toBe("1d8");
    expect(rapier.damageType).toBe("piercing");
    // NOTE: Class weapon proficiency not yet modeled; proficiency bonus not added
    // Attack bonus = DEX +4 only
  });

  // -------------------------------------------------------------------------
  // Nara: Sorcerer 2
  // -------------------------------------------------------------------------
  it("Nara: Sorcerer 2, expected sheet-baseline values", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "nara"));
    expect(state.name).toBe("Nara");
    expect(state.level).toBe(2);
    expect(state.armorClass.total).toBe(10);
    expect(state.maxHP).toBe(12);
    expect(state.passivePerception.total).toBe(11);
    expect(state.spellcasting).not.toBeNull();
    expect(state.spellcasting?.spellSaveDc).toBe(13);
  });

  it("Nara: skill proficiencies from class choices", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "nara"));
    const proficientSkills = state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort();
    expect(proficientSkills).toEqual(["Arcana", "Insight"]);

    const arcana = state.skillState.skills.find((s) => s.skillName === "Arcana")!;
    expect(arcana.bonus).toBe(5); // INT +3 + prof +2

    const insight = state.skillState.skills.find((s) => s.skillName === "Insight")!;
    expect(insight.bonus).toBe(3); // WIS +1 + prof +2
  });

  it("Nara: Sorcery Points resource", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "nara"));
    const resourceNames = state.resources.map((r) => r.name);
    expect(resourceNames).toContain("Sorcery Points");

    const sp = state.resources.find((r) => r.name === "Sorcery Points")!;
    expect(sp.maxUses).toBe(2); // Sorcerer level 2
  });

  it("Nara: no attack profiles (no equipment)", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "nara"));
    expect(state.attackProfiles).toHaveLength(0);
  });
});
