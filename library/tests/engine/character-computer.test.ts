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
