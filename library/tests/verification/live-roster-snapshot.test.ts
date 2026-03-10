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
});
