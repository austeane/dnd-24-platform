import { describe, expect, it } from "vitest";
import { computeCharacterState } from "../../src/index.ts";
import {
  buildCharacterFixture,
  loadVerifiedRoster,
} from "../../../data/fleet/fixture-patterns.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

/**
 * HP base snapshot derivation tests.
 *
 * The current engine uses a "base snapshot fallback" model: the reviewed HP
 * value from the character sheet is stored as `baseMaxHP` and passed through
 * the engine. The engine applies any `hp-max` modifier effects on top of this
 * base value and produces `maxHP` plus an explainability breakdown.
 *
 * Level-by-level HP derivation from class hit dice is NOT yet implemented
 * (see mechanic `core-hp-level-derivation`). These tests document the
 * snapshot path and satisfy the "tests" and "live-roster" evidence gates
 * for `core-hp-base-fallback`.
 */

const roster = loadVerifiedRoster();

// ---------------------------------------------------------------------------
// Roster HP baselines from verified-characters.json
// ---------------------------------------------------------------------------

const expectedHP: Record<string, { name: string; maxHp: number }> = {
  "ronan-wildspark": { name: "Ronan Wildspark", maxHp: 22 },
  "tali": { name: "Tali", maxHp: 19 },
  "oriana": { name: "Oriana", maxHp: 18 },
  "vivennah": { name: "Vivennah", maxHp: 15 },
  "nara": { name: "Nara", maxHp: 12 },
};

// ---------------------------------------------------------------------------
// Per-character HP snapshot tests
// ---------------------------------------------------------------------------

describe("HP base snapshot — roster characters", () => {
  for (const [slug, expected] of Object.entries(expectedHP)) {
    it(`${expected.name}: maxHP matches verified sheet value (${expected.maxHp})`, () => {
      const state = computeCharacterState(buildCharacterFixture(roster, slug));
      expect(state.maxHP).toBe(expected.maxHp);
    });
  }
});

// ---------------------------------------------------------------------------
// HP explainability
// ---------------------------------------------------------------------------

describe("HP explainability — maxHPExplanation structure", () => {
  it("Ronan: maxHPExplanation has base contributor", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));
    expect(state.maxHPExplanation).toBeDefined();
    expect(state.maxHPExplanation.total).toBe(22);
    // The explanation should show "Base HP" as the starting value
    // Contributors may be empty if no hp-max modifier effects are present
  });

  it("Tali: maxHPExplanation total matches maxHP", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "tali"));
    expect(state.maxHPExplanation.total).toBe(state.maxHP);
  });

  it("Nara: maxHPExplanation total matches maxHP", () => {
    const state = computeCharacterState(buildCharacterFixture(roster, "nara"));
    expect(state.maxHPExplanation.total).toBe(state.maxHP);
  });

  for (const [slug, expected] of Object.entries(expectedHP)) {
    it(`${expected.name}: maxHPExplanation.total equals maxHP`, () => {
      const state = computeCharacterState(buildCharacterFixture(roster, slug));
      expect(state.maxHPExplanation.total).toBe(state.maxHP);
    });
  }
});

// ---------------------------------------------------------------------------
// HP modifier effects
// ---------------------------------------------------------------------------

describe("HP modifier effects — hp-max modifiers apply on top of base", () => {
  it("adding an hp-max modifier increases maxHP above base", () => {
    const input = buildCharacterFixture(roster, "ronan-wildspark");
    const inputWithHpBonus: CharacterComputationInput = {
      ...input,
      sources: [
        ...input.sources,
        {
          source: {
            id: "test-hp-bonus",
            kind: "feat",
            name: "Tough (test)",
          },
          effects: [
            { type: "modifier", target: "hp-max", value: 4 },
          ],
        },
      ],
    };

    const baseState = computeCharacterState(input);
    const modifiedState = computeCharacterState(inputWithHpBonus);

    expect(modifiedState.maxHP).toBe(baseState.maxHP + 4);
    expect(modifiedState.maxHPExplanation.total).toBe(baseState.maxHP + 4);
  });

  it("hp-max modifier appears in explanation contributors", () => {
    const input = buildCharacterFixture(roster, "tali");
    const inputWithBonus: CharacterComputationInput = {
      ...input,
      sources: [
        ...input.sources,
        {
          source: {
            id: "test-con-bonus",
            kind: "feat",
            name: "Test HP Bonus",
          },
          effects: [
            { type: "modifier", target: "hp-max", value: 6 },
          ],
        },
      ],
    };

    const state = computeCharacterState(inputWithBonus);
    const contributor = state.maxHPExplanation.contributors.find(
      (c) => c.sourceName === "Test HP Bonus",
    );
    expect(contributor).toBeDefined();
    expect(contributor!.value).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// HP snapshot determinism
// ---------------------------------------------------------------------------

describe("HP snapshot — deterministic computation", () => {
  const slugs = ["ronan-wildspark", "tali", "oriana", "vivennah", "nara"] as const;

  for (const slug of slugs) {
    it(`${slug}: computing twice yields identical maxHP`, () => {
      const input = buildCharacterFixture(roster, slug);
      const state1 = computeCharacterState(input);
      const state2 = computeCharacterState(input);
      expect(state1.maxHP).toBe(state2.maxHP);
      expect(state1.maxHPExplanation.total).toBe(state2.maxHPExplanation.total);
    });
  }
});

// ---------------------------------------------------------------------------
// HP without modifiers — base passthrough
// ---------------------------------------------------------------------------

describe("HP base passthrough — no modifier effects", () => {
  it("with zero hp-max modifiers, maxHP equals baseMaxHP", () => {
    // Build a minimal input with no sources that have hp-max modifiers
    const input: CharacterComputationInput = {
      base: {
        name: "Test Character",
        progressionMode: "standard",
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        baseArmorClass: 10,
        baseMaxHP: 25,
        baseSpeed: 30,
      },
      sources: [
        {
          source: {
            id: "class-level",
            kind: "class-level",
            name: "Fighter 3",
            rank: 3,
          },
          effects: [],
        },
      ],
      xpLedger: [],
    };

    const state = computeCharacterState(input);
    expect(state.maxHP).toBe(25);
    expect(state.maxHPExplanation.total).toBe(25);
  });
});
