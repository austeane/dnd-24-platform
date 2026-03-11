import { describe, expect, it } from "vitest";
import {
  toAbilityScoreProps,
  toCharacterCardProps,
  toCombatPanelProps,
  toFeaturesPanelProps,
  toSkillsPanelProps,
  toXPBarProps,
} from "./-adapters.ts";
import type { TavernShellData } from "./-server.ts";

const shellData: TavernShellData = {
  campaign: {
    id: "campaign-1",
    name: "Real AA Campaign",
    progressionMode: "hybrid",
    enabledPackIds: ["srd-5e-2024", "advanced-adventurers"],
  },
  character: {
    id: "character-1",
    slug: "tali",
    name: "Tali",
    ownerLabel: "Austin",
  },
  summary: {
    subtitle: "Druid 2 · Sage",
    className: "Druid",
    species: "Elf",
    level: 2,
    abilityScores: [
      { name: "strength", score: 10, modifier: 0, isPrimary: false },
      { name: "dexterity", score: 14, modifier: 2, isPrimary: false },
      { name: "constitution", score: 12, modifier: 1, isPrimary: false },
      { name: "intelligence", score: 11, modifier: 0, isPrimary: false },
      { name: "wisdom", score: 16, modifier: 3, isPrimary: true },
      { name: "charisma", score: 8, modifier: -1, isPrimary: false },
    ],
    combat: {
      maxHp: 17,
      armorClass: 15,
      acBreakdown: "Leather Armor +2, Shield +2",
      initiative: 2,
      speed: 30,
      spellSaveDc: 13,
      proficiencyBonus: 2,
    },
    skills: [
      { name: "Nature", bonus: 4, proficient: true, expertise: false },
    ],
    features: [
      { name: "Wild Shape", origin: "Druid" },
    ],
    xp: {
      totalEarned: 10,
      totalSpent: 5,
      banked: 5,
    },
  },
  spellbook: {
    castingAbility: "Wisdom",
    spellSaveDC: 13,
    spellAttackBonus: 5,
    groups: [],
  },
  inventoryRuntime: {
    attackProfiles: [],
    resources: [],
  },
};

describe("tavern route adapters", () => {
  it("maps the shell DTO to overview panel props", () => {
    expect(toCharacterCardProps(shellData)).toEqual({
      name: "Tali",
      subtitle: "Druid 2 · Sage",
      level: 2,
      className: "Druid",
      species: "Elf",
    });
    expect(toCombatPanelProps(shellData)).toMatchObject({
      maxHp: 17,
      armorClass: 15,
      spellSaveDc: 13,
    });
    expect(toXPBarProps(shellData)).toEqual({
      totalEarned: 10,
      totalSpent: 5,
      banked: 5,
      progressionMode: "hybrid",
    });
  });

  it("preserves abilities, skills, and features without raw runtime access", () => {
    expect(toAbilityScoreProps(shellData)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "wisdom",
          abbreviation: "WIS",
          modifier: 3,
          isPrimary: true,
        }),
      ]),
    );
    expect(toSkillsPanelProps(shellData)).toEqual({
      skills: [{ name: "Nature", bonus: 4, proficient: true, expertise: false }],
    });
    expect(toFeaturesPanelProps(shellData)).toEqual({
      features: [{ name: "Wild Shape", origin: "Druid" }],
    });
  });
});
