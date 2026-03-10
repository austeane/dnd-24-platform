import { describe, expect, it } from "vitest";
import {
  buildSkillState,
  computeCharacterState,
  SKILL_ABILITY_MAP,
} from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";
import type { EffectEnvelope } from "../../src/engine/shared.ts";
import { flattenEffects } from "../../src/engine/shared.ts";

// --- Roster character fixtures ---

/** Ronan Wildspark — Fighter 2, skills: Athletics (class), Intimidation (class) */
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
      source: { id: "class-level-fighter", kind: "class-level", name: "Fighter 2", rank: 2 },
      effects: [
        { type: "proficiency", category: "skill", value: "Athletics" },
        { type: "proficiency", category: "skill", value: "Intimidation" },
      ],
    },
  ],
  xpLedger: [],
};

/** Tali — Druid 2, skills: Nature (class), Perception (class) */
const taliInput: CharacterComputationInput = {
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
  sources: [
    {
      source: { id: "class-level-druid", kind: "class-level", name: "Druid 2", rank: 2 },
      effects: [
        { type: "proficiency", category: "skill", value: "Nature" },
        { type: "proficiency", category: "skill", value: "Perception" },
      ],
    },
  ],
  xpLedger: [],
};

/**
 * Oriana — Warlock 2, skills: Arcana (class), Deception (class),
 * Perception (feat:Skilled), Persuasion (feat:Skilled), Stealth (feat:Skilled)
 */
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
  sources: [
    {
      source: { id: "class-level-warlock", kind: "class-level", name: "Warlock 2", rank: 2 },
      effects: [
        { type: "proficiency", category: "skill", value: "Arcana" },
        { type: "proficiency", category: "skill", value: "Deception" },
      ],
    },
    {
      source: { id: "feat-skilled", kind: "feat", name: "Skilled" },
      effects: [
        { type: "proficiency", category: "skill", value: "Perception" },
        { type: "proficiency", category: "skill", value: "Persuasion" },
        { type: "proficiency", category: "skill", value: "Stealth" },
      ],
    },
  ],
  xpLedger: [],
};

/** Vivennah — Bard 2, skills: Acrobatics (class), Performance (class), Persuasion (class) */
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
      source: { id: "class-level-bard", kind: "class-level", name: "Bard 2", rank: 2 },
      effects: [
        { type: "proficiency", category: "skill", value: "Acrobatics" },
        { type: "proficiency", category: "skill", value: "Performance" },
        { type: "proficiency", category: "skill", value: "Persuasion" },
      ],
    },
  ],
  xpLedger: [],
};

/** Nara — Sorcerer 2, skills: Arcana (class), Insight (class) */
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
      source: { id: "class-level-sorcerer", kind: "class-level", name: "Sorcerer 2", rank: 2 },
      effects: [
        { type: "proficiency", category: "skill", value: "Arcana" },
        { type: "proficiency", category: "skill", value: "Insight" },
      ],
    },
  ],
  xpLedger: [],
};

// --- Tests ---

describe("SKILL_ABILITY_MAP", () => {
  it("contains all 18 D&D skills", () => {
    expect(SKILL_ABILITY_MAP.size).toBe(18);
  });

  it("maps Perception to wisdom", () => {
    expect(SKILL_ABILITY_MAP.get("Perception")).toBe("wisdom");
  });

  it("maps Athletics to strength", () => {
    expect(SKILL_ABILITY_MAP.get("Athletics")).toBe("strength");
  });
});

describe("buildSkillState", () => {
  describe("Ronan Wildspark — Fighter 2", () => {
    const effects = flattenEffects(ronanInput.sources);
    const skillState = buildSkillState(ronanInput.base.abilityScores, 2, effects);

    it("computes Athletics bonus = STR +1 + prof +2 = +3", () => {
      const athletics = skillState.skills.find((s) => s.skillName === "Athletics")!;
      expect(athletics.bonus).toBe(3);
      expect(athletics.proficient).toBe(true);
      expect(athletics.abilityModifier).toBe(1);
      expect(athletics.ability).toBe("strength");
    });

    it("computes Intimidation bonus = CHA -1 + prof +2 = +1", () => {
      const intimidation = skillState.skills.find((s) => s.skillName === "Intimidation")!;
      expect(intimidation.bonus).toBe(1);
      expect(intimidation.proficient).toBe(true);
      expect(intimidation.abilityModifier).toBe(-1);
    });

    it("non-proficient Perception = WIS +0", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.bonus).toBe(0);
      expect(perception.proficient).toBe(false);
    });

    it("derives passive Perception = 10 + 0 = 10", () => {
      expect(skillState.passivePerception.total).toBe(10);
    });

    it("cites source for proficient skills", () => {
      const athletics = skillState.skills.find((s) => s.skillName === "Athletics")!;
      expect(athletics.sources).toContain("Fighter 2");
    });

    it("non-proficient skills have empty sources", () => {
      const stealth = skillState.skills.find((s) => s.skillName === "Stealth")!;
      expect(stealth.sources).toEqual([]);
    });
  });

  describe("Tali — Druid 2", () => {
    const effects = flattenEffects(taliInput.sources);
    const skillState = buildSkillState(taliInput.base.abilityScores, 2, effects);

    it("computes Nature bonus = INT +2 + prof +2 = +4", () => {
      const nature = skillState.skills.find((s) => s.skillName === "Nature")!;
      expect(nature.bonus).toBe(4);
      expect(nature.proficient).toBe(true);
    });

    it("computes Perception bonus = WIS +3 + prof +2 = +5", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.bonus).toBe(5);
      expect(perception.proficient).toBe(true);
    });

    it("derives passive Perception = 10 + 5 = 15", () => {
      expect(skillState.passivePerception.total).toBe(15);
    });

    it("cites Druid 2 as source for Perception", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.sources).toContain("Druid 2");
    });
  });

  describe("Oriana — Warlock 2", () => {
    const effects = flattenEffects(orianaInput.sources);
    const skillState = buildSkillState(orianaInput.base.abilityScores, 2, effects);

    it("computes Arcana bonus = INT +0 + prof +2 = +2", () => {
      const arcana = skillState.skills.find((s) => s.skillName === "Arcana")!;
      expect(arcana.bonus).toBe(2);
      expect(arcana.proficient).toBe(true);
    });

    it("computes Deception bonus = CHA +3 + prof +2 = +5", () => {
      const deception = skillState.skills.find((s) => s.skillName === "Deception")!;
      expect(deception.bonus).toBe(5);
      expect(deception.proficient).toBe(true);
    });

    it("computes Perception bonus = WIS +2 + prof +2 = +4 (from Skilled feat)", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.bonus).toBe(4);
      expect(perception.proficient).toBe(true);
    });

    it("computes Persuasion bonus = CHA +3 + prof +2 = +5 (from Skilled feat)", () => {
      const persuasion = skillState.skills.find((s) => s.skillName === "Persuasion")!;
      expect(persuasion.bonus).toBe(5);
    });

    it("computes Stealth bonus = DEX +1 + prof +2 = +3 (from Skilled feat)", () => {
      const stealth = skillState.skills.find((s) => s.skillName === "Stealth")!;
      expect(stealth.bonus).toBe(3);
    });

    it("derives passive Perception = 10 + 4 = 14", () => {
      expect(skillState.passivePerception.total).toBe(14);
    });

    it("cites Skilled as source for feat-granted skills", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.sources).toContain("Skilled");
      const stealth = skillState.skills.find((s) => s.skillName === "Stealth")!;
      expect(stealth.sources).toContain("Skilled");
    });

    it("cites Warlock 2 as source for class skills", () => {
      const arcana = skillState.skills.find((s) => s.skillName === "Arcana")!;
      expect(arcana.sources).toContain("Warlock 2");
    });
  });

  describe("Vivennah — Bard 2", () => {
    const effects = flattenEffects(vivennahInput.sources);
    const skillState = buildSkillState(vivennahInput.base.abilityScores, 2, effects);

    it("computes Acrobatics bonus = DEX +4 + prof +2 = +6", () => {
      const acrobatics = skillState.skills.find((s) => s.skillName === "Acrobatics")!;
      expect(acrobatics.bonus).toBe(6);
      expect(acrobatics.proficient).toBe(true);
    });

    it("computes Performance bonus = CHA +3 + prof +2 = +5", () => {
      const performance = skillState.skills.find((s) => s.skillName === "Performance")!;
      expect(performance.bonus).toBe(5);
    });

    it("computes Persuasion bonus = CHA +3 + prof +2 = +5", () => {
      const persuasion = skillState.skills.find((s) => s.skillName === "Persuasion")!;
      expect(persuasion.bonus).toBe(5);
    });

    it("non-proficient Perception = WIS +0", () => {
      const perception = skillState.skills.find((s) => s.skillName === "Perception")!;
      expect(perception.bonus).toBe(0);
      expect(perception.proficient).toBe(false);
    });

    it("derives passive Perception = 10 + 0 = 10", () => {
      expect(skillState.passivePerception.total).toBe(10);
    });
  });

  describe("Nara — Sorcerer 2", () => {
    const effects = flattenEffects(naraInput.sources);
    const skillState = buildSkillState(naraInput.base.abilityScores, 2, effects);

    it("computes Arcana bonus = INT +3 + prof +2 = +5", () => {
      const arcana = skillState.skills.find((s) => s.skillName === "Arcana")!;
      expect(arcana.bonus).toBe(5);
      expect(arcana.proficient).toBe(true);
    });

    it("computes Insight bonus = WIS +1 + prof +2 = +3", () => {
      const insight = skillState.skills.find((s) => s.skillName === "Insight")!;
      expect(insight.bonus).toBe(3);
      expect(insight.proficient).toBe(true);
    });

    it("derives passive Perception = 10 + 1 = 11 (WIS +1, no Perception prof)", () => {
      expect(skillState.passivePerception.total).toBe(11);
    });

    it("cites Sorcerer 2 as source for Arcana", () => {
      const arcana = skillState.skills.find((s) => s.skillName === "Arcana")!;
      expect(arcana.sources).toContain("Sorcerer 2");
    });
  });
});

describe("expertise doubles proficiency bonus", () => {
  it("expertise adds proficiency bonus again on top of proficiency", () => {
    const effects: EffectEnvelope[] = [
      {
        sourceName: "Rogue 1",
        sourceDescription: undefined,
        effect: { type: "proficiency", category: "skill", value: "Stealth" },
      },
      {
        sourceName: "Rogue 1",
        sourceDescription: undefined,
        effect: { type: "expertise", skill: "Stealth" },
      },
    ];

    const abilityScores = {
      strength: 10,
      dexterity: 16,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const skillState = buildSkillState(abilityScores, 2, effects);
    const stealth = skillState.skills.find((s) => s.skillName === "Stealth")!;

    // DEX +3, proficiency +2, expertise +2 = +7
    expect(stealth.bonus).toBe(7);
    expect(stealth.proficient).toBe(true);
    expect(stealth.expertise).toBe(true);
    expect(stealth.proficiencyBonus).toBe(4); // 2 (prof) + 2 (expertise)
    expect(stealth.sources).toContain("Rogue 1");
    expect(stealth.sources).toContain("Rogue 1 (expertise)");
  });

  it("expertise on Perception doubles proficiency in passive Perception", () => {
    const effects: EffectEnvelope[] = [
      {
        sourceName: "Rogue 1",
        sourceDescription: undefined,
        effect: { type: "proficiency", category: "skill", value: "Perception" },
      },
      {
        sourceName: "Rogue 1",
        sourceDescription: undefined,
        effect: { type: "expertise", skill: "Perception" },
      },
    ];

    const abilityScores = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 14,
      charisma: 10,
    };

    const skillState = buildSkillState(abilityScores, 2, effects);

    // passive = 10 + WIS +2 + prof 2 + expertise 2 = 16
    expect(skillState.passivePerception.total).toBe(16);
  });
});

describe("passive Perception explanation cites sources", () => {
  it("passive-perception modifier contributors appear in explanation", () => {
    const effects: EffectEnvelope[] = [
      {
        sourceName: "Druid 2",
        sourceDescription: undefined,
        effect: { type: "proficiency", category: "skill", value: "Perception" },
      },
      {
        sourceName: "Observant feat",
        sourceDescription: undefined,
        effect: { type: "modifier", target: "passive-perception", value: 5, condition: undefined },
      },
    ];

    const abilityScores = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 14,
      charisma: 10,
    };

    const skillState = buildSkillState(abilityScores, 2, effects);

    // passive base = 10 + WIS +2 + prof 2 = 14, then +5 from Observant = 19
    expect(skillState.passivePerception.total).toBe(19);
    expect(skillState.passivePerception.contributors.length).toBe(2);
    expect(
      skillState.passivePerception.contributors.some((c) => c.sourceName === "Observant feat" && c.value === 5),
    ).toBe(true);
  });
});

describe("computeCharacterState integrates skillState", () => {
  it("skillState is populated on computed character state", () => {
    const state = computeCharacterState(ronanInput);
    expect(state.skillState).toBeDefined();
    expect(state.skillState.skills).toHaveLength(18);

    const athletics = state.skillState.skills.find((s) => s.skillName === "Athletics")!;
    expect(athletics.bonus).toBe(3);
  });
});
