import { describe, expect, it } from "vitest";
import {
  computeCharacterState,
  evaluatePrerequisites,
} from "@dnd/library";
import type { CharacterComputationInput } from "@dnd/library";
import type { AAPrerequisite } from "@dnd/library";

/**
 * Focused prerequisite evaluator tests covering all five prerequisite types
 * and the source/ability-name matching logic used by AA-ability prerequisites.
 *
 * These tests exercise the evaluatePrerequisites function from @dnd/library
 * in the context of the progression service's spend-plan commit flow, where
 * AA-ability prerequisites are checked before allowing canonical-source commits.
 */

function makeState(overrides: Partial<CharacterComputationInput> = {}): ReturnType<typeof computeCharacterState> {
  const input: CharacterComputationInput = {
    base: {
      name: "TestChar",
      progressionMode: "hybrid",
      abilityScores: {
        strength: 10,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 13,
        charisma: 16,
      },
      baseArmorClass: 12,
      baseMaxHP: 10,
      baseSpeed: 30,
      spellcastingAbility: "charisma",
    },
    sources: [],
    xpLedger: [],
    ...overrides,
  };
  return computeCharacterState(input);
}

describe("evaluatePrerequisites — level", () => {
  it("passes when character level meets the requirement", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Warlock 3", rank: 3 },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "level", value: "Level 3" }],
      state,
    );

    expect(result.passed).toBe(true);
    expect(result.checks[0].passed).toBe(true);
    expect(result.checks[0].reason).toContain("3/3");
  });

  it("fails when character level is below the requirement", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Warlock 1", rank: 1 },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "level", value: "Level 5" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].passed).toBe(false);
    expect(result.checks[0].reason).toContain("1/5");
  });

  it("handles various level string formats", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Warlock 8", rank: 8 },
          effects: [],
        },
      ],
    });

    // Both "Level 8" and "8" should work
    expect(evaluatePrerequisites([{ type: "level", value: "Level 8" }], state).passed).toBe(true);
    expect(evaluatePrerequisites([{ type: "level", value: "8" }], state).passed).toBe(true);
  });
});

describe("evaluatePrerequisites — spellcasting", () => {
  it("passes when character has spellcasting", () => {
    const state = makeState({
      base: {
        name: "TestChar",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 10, dexterity: 14, constitution: 12,
          intelligence: 10, wisdom: 13, charisma: 16,
        },
        baseArmorClass: 12,
        baseMaxHP: 10,
        baseSpeed: 30,
        spellcastingAbility: "charisma",
      },
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 1", rank: 1 },
          effects: [
            {
              type: "grant-spell-access",
              spell: {
                spellName: "Cure Wounds",
                alwaysPrepared: false,
                source: "Bard",
              },
            },
          ],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "spellcasting", value: "Spellcasting" }],
      state,
    );

    expect(result.passed).toBe(true);
    expect(result.checks[0].reason).toContain("spellcasting capability");
  });

  it("fails when character has no spellcasting", () => {
    const state = makeState({
      base: {
        name: "TestFighter",
        progressionMode: "standard",
        abilityScores: {
          strength: 16, dexterity: 14, constitution: 14,
          intelligence: 10, wisdom: 10, charisma: 8,
        },
        baseArmorClass: 16,
        baseMaxHP: 12,
        baseSpeed: 30,
      },
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Fighter 1", rank: 1 },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "spellcasting", value: "Spellcasting" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain("no spellcasting capability");
  });
});

describe("evaluatePrerequisites — proficiency", () => {
  it("passes when character has the required skill proficiency", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 1", rank: 1 },
          effects: [
            { type: "proficiency", category: "skill", value: "Perception" },
          ],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "proficiency", value: "Perception" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("fails when character lacks the required proficiency", () => {
    const state = makeState();

    const result = evaluatePrerequisites(
      [{ type: "proficiency", value: "Arcana" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain("Missing proficiency");
  });

  it("matches saving throw proficiencies", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Warlock 1", rank: 1 },
          effects: [
            { type: "proficiency", category: "saving-throw", value: "Charisma" },
          ],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "proficiency", value: "Charisma" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("matches weapon proficiencies", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Fighter 1", rank: 1 },
          effects: [
            { type: "proficiency", category: "weapon", value: "Longsword" },
          ],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "proficiency", value: "Longsword" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("is case-insensitive", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 1", rank: 1 },
          effects: [
            { type: "proficiency", category: "skill", value: "Perception" },
          ],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "proficiency", value: "perception" }],
      state,
    );

    expect(result.passed).toBe(true);
  });
});

describe("evaluatePrerequisites — ability-score", () => {
  it("passes when ability score meets the minimum", () => {
    const state = makeState(); // charisma is 16

    const result = evaluatePrerequisites(
      [{ type: "ability-score", value: "CHA 16" }],
      state,
    );

    expect(result.passed).toBe(true);
    expect(result.checks[0].reason).toContain("16/16");
  });

  it("fails when ability score is below the minimum", () => {
    const state = makeState(); // strength is 10

    const result = evaluatePrerequisites(
      [{ type: "ability-score", value: "STR 13" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain("10/13");
  });

  it("supports full ability name format", () => {
    const state = makeState(); // dexterity is 14

    const result = evaluatePrerequisites(
      [{ type: "ability-score", value: "Dexterity 12" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("rejects unparseable ability-score format", () => {
    const state = makeState();

    const result = evaluatePrerequisites(
      [{ type: "ability-score", value: "not a valid format" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain("Could not parse");
  });
});

describe("evaluatePrerequisites — source/ability match (progression-prerequisite-source-match)", () => {
  it("matches by source name", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 2", rank: 2 },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "ability", value: "Bard" }],
      state,
    );

    expect(result.passed).toBe(true);
    expect(result.checks[0].reason).toContain("Found source matching");
  });

  it("matches by source entity ID", () => {
    const state = makeState({
      sources: [
        {
          source: {
            id: "src-1",
            kind: "aa-purchase",
            name: "Bardic Inspiration",
            entityId: "aa-ability-bardic-inspiration",
          },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "ability", value: "bardic-inspiration" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("matches by partial source name (substring)", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Warlock 3", rank: 3 },
          effects: [
            {
              type: "grant-action",
              action: {
                name: "Eldritch Blast",
                timing: "action",
                description: "A beam of crackling energy.",
              },
            },
          ],
        },
        {
          source: {
            id: "feat-1",
            kind: "aa-purchase",
            name: "Agonizing Blast",
            entityId: "aa-ability-agonizing-blast",
          },
          effects: [],
        },
      ],
    });

    // The prerequisite "Agonizing Blast" should match a source named "Agonizing Blast"
    const result = evaluatePrerequisites(
      [{ type: "ability", value: "Agonizing Blast" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("fails when no source matches the ability name", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Fighter 1", rank: 1 },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "ability", value: "Rage" }],
      state,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain("No source matched");
  });

  it("is case-insensitive in matching", () => {
    const state = makeState({
      sources: [
        {
          source: {
            id: "src-1",
            kind: "aa-purchase",
            name: "Bardic Inspiration",
          },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "ability", value: "bardic inspiration" }],
      state,
    );

    expect(result.passed).toBe(true);
  });

  it("matches source ID substring for AA ability references", () => {
    const state = makeState({
      sources: [
        {
          source: {
            id: "src-1",
            kind: "class-level",
            name: "Warlock 1",
            rank: 1,
          },
          effects: [],
        },
        {
          source: {
            id: "src-2",
            kind: "aa-purchase",
            name: "Cunning Action",
            entityId: "aa-ability-cunning-action",
          },
          effects: [],
        },
      ],
    });

    const result = evaluatePrerequisites(
      [{ type: "ability", value: "Cunning Action" }],
      state,
    );

    expect(result.passed).toBe(true);
  });
});

describe("evaluatePrerequisites — combined checks", () => {
  it("all checks must pass for overall pass", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 5", rank: 5 },
          effects: [
            { type: "proficiency", category: "skill", value: "Performance" },
            {
              type: "grant-spell-access",
              spell: {
                spellName: "Cure Wounds",
                alwaysPrepared: false,
                source: "Bard",
              },
            },
          ],
        },
      ],
    });

    const prereqs: AAPrerequisite[] = [
      { type: "level", value: "Level 5" },
      { type: "spellcasting", value: "Spellcasting" },
      { type: "proficiency", value: "Performance" },
      { type: "ability-score", value: "CHA 16" },
      { type: "ability", value: "Bard" },
    ];

    const result = evaluatePrerequisites(prereqs, state);

    expect(result.passed).toBe(true);
    expect(result.checks).toHaveLength(5);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("fails if any single check fails", () => {
    const state = makeState({
      sources: [
        {
          source: { id: "cl-1", kind: "class-level", name: "Bard 3", rank: 3 },
          effects: [
            { type: "proficiency", category: "skill", value: "Performance" },
          ],
        },
      ],
    });

    const prereqs: AAPrerequisite[] = [
      { type: "level", value: "Level 3" },      // passes (level 3)
      { type: "ability-score", value: "STR 18" }, // fails (strength is 10)
    ];

    const result = evaluatePrerequisites(prereqs, state);

    expect(result.passed).toBe(false);
    expect(result.checks[0].passed).toBe(true);
    expect(result.checks[1].passed).toBe(false);
  });

  it("returns empty checks array and passes for empty prerequisites", () => {
    const state = makeState();

    const result = evaluatePrerequisites([], state);

    expect(result.passed).toBe(true);
    expect(result.checks).toHaveLength(0);
  });
});
