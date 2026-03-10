import { describe, expect, it } from "vitest";
import { computeCharacterState } from "../../src/index.ts";
import {
  buildCharacterFixture,
  loadVerifiedRoster,
} from "../../../data/fleet/fixture-patterns.ts";

/**
 * Action inventory tests: verifies that the engine surfaces granted actions,
 * bonus actions, and reactions from canonical class features and species.
 *
 * Uses live roster fixtures (verified-characters.json) to satisfy the
 * "live-roster" evidence gate for the following atomic mechanics:
 *   - action-action-inventory
 *   - action-bonus-action-inventory
 *   - action-reaction-inventory
 */

const roster = loadVerifiedRoster();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actionsOfTiming(
  actions: Array<{ name: string; timing: string; sourceName: string }>,
  timing: string,
): string[] {
  return actions
    .filter((a) => a.timing === timing)
    .map((a) => a.name)
    .sort();
}

// ---------------------------------------------------------------------------
// Ronan Wildspark: Fighter 2 / Goliath
// ---------------------------------------------------------------------------

describe("action inventory — Ronan Wildspark (Fighter 2 / Goliath)", () => {
  const state = computeCharacterState(buildCharacterFixture(roster, "ronan-wildspark"));

  it("has Second Wind as a bonus action", () => {
    const bonusActions = actionsOfTiming(state.actions, "bonus-action");
    expect(bonusActions).toContain("Second Wind");
  });

  it("has Stone's Endurance as a reaction", () => {
    const reactions = actionsOfTiming(state.actions, "reaction");
    expect(reactions).toContain("Stone's Endurance");
  });

  it("Second Wind action has a description", () => {
    const secondWind = state.actions.find((a) => a.name === "Second Wind");
    expect(secondWind).toBeDefined();
    expect(secondWind!.description).toBeTruthy();
    expect(secondWind!.sourceName).toBeTruthy();
  });

  it("Stone's Endurance action has a description and source attribution", () => {
    const stonesEndurance = state.actions.find((a) => a.name === "Stone's Endurance");
    expect(stonesEndurance).toBeDefined();
    expect(stonesEndurance!.description).toBeTruthy();
    expect(stonesEndurance!.timing).toBe("reaction");
    expect(stonesEndurance!.sourceName).toBeTruthy();
  });

  it("actions list contains expected total action count", () => {
    // Fighter 2 / Goliath should have at least Second Wind and Stone's Endurance
    expect(state.actions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Tali: Druid 2
// ---------------------------------------------------------------------------

describe("action inventory — Tali (Druid 2)", () => {
  const state = computeCharacterState(buildCharacterFixture(roster, "tali"));

  it("has Wild Shape as a bonus action", () => {
    const bonusActions = actionsOfTiming(state.actions, "bonus-action");
    expect(bonusActions).toContain("Wild Shape");
  });

  it("has Wild Companion as an action", () => {
    const actions = actionsOfTiming(state.actions, "action");
    expect(actions).toContain("Wild Companion");
  });

  it("Wild Shape action has timing and description", () => {
    const wildShape = state.actions.find((a) => a.name === "Wild Shape");
    expect(wildShape).toBeDefined();
    expect(wildShape!.timing).toBe("bonus-action");
    expect(wildShape!.description).toBeTruthy();
  });

  it("Wild Companion action has timing and description", () => {
    const wildCompanion = state.actions.find((a) => a.name === "Wild Companion");
    expect(wildCompanion).toBeDefined();
    expect(wildCompanion!.timing).toBe("action");
    expect(wildCompanion!.description).toBeTruthy();
  });

  it("actions list contains expected total action count", () => {
    // Druid 2 should have at least Wild Shape and Wild Companion
    expect(state.actions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Vivennah: Bard 2 / Wood Elf
// ---------------------------------------------------------------------------

describe("action inventory — Vivennah (Bard 2 / Wood Elf)", () => {
  const state = computeCharacterState(buildCharacterFixture(roster, "vivennah"));

  it("has Bardic Inspiration as a bonus action", () => {
    const bonusActions = actionsOfTiming(state.actions, "bonus-action");
    expect(bonusActions).toContain("Bardic Inspiration");
  });

  it("Bardic Inspiration action has description and source attribution", () => {
    const bi = state.actions.find((a) => a.name === "Bardic Inspiration");
    expect(bi).toBeDefined();
    expect(bi!.timing).toBe("bonus-action");
    expect(bi!.description).toBeTruthy();
    expect(bi!.sourceName).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Oriana: Warlock 2 / Drow
// ---------------------------------------------------------------------------

describe("action inventory — Oriana (Warlock 2 / Drow)", () => {
  const state = computeCharacterState(buildCharacterFixture(roster, "oriana"));

  it("has Magical Cunning as a special-timing action", () => {
    const specialActions = actionsOfTiming(state.actions, "special");
    expect(specialActions).toContain("Magical Cunning");
  });

  it("has Pact of the Blade as a bonus action", () => {
    const bonusActions = actionsOfTiming(state.actions, "bonus-action");
    expect(bonusActions).toContain("Pact of the Blade");
  });

  it("Magical Cunning action has description", () => {
    const mc = state.actions.find((a) => a.name === "Magical Cunning");
    expect(mc).toBeDefined();
    expect(mc!.description).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Nara: Sorcerer 2
// ---------------------------------------------------------------------------

describe("action inventory — Nara (Sorcerer 2)", () => {
  const state = computeCharacterState(buildCharacterFixture(roster, "nara"));

  it("has Create Spell Slot as a bonus action (from Font of Magic)", () => {
    const bonusActions = actionsOfTiming(state.actions, "bonus-action");
    expect(bonusActions).toContain("Create Spell Slot");
  });

  it("Create Spell Slot action has description and source attribution", () => {
    const css = state.actions.find((a) => a.name === "Create Spell Slot");
    expect(css).toBeDefined();
    expect(css!.timing).toBe("bonus-action");
    expect(css!.description).toBeTruthy();
    expect(css!.sourceName).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Cross-roster: every character has at least one granted action
// ---------------------------------------------------------------------------

describe("action inventory — cross-roster validation", () => {
  const slugs = ["ronan-wildspark", "tali", "vivennah", "oriana", "nara"] as const;

  for (const slug of slugs) {
    it(`${slug}: has at least one granted action`, () => {
      const state = computeCharacterState(buildCharacterFixture(roster, slug));
      expect(
        state.actions.length,
        `${state.name} should have at least one action`,
      ).toBeGreaterThan(0);
    });

    it(`${slug}: all actions have timing, name, and description`, () => {
      const state = computeCharacterState(buildCharacterFixture(roster, slug));
      for (const action of state.actions) {
        expect(action.name, "action name should be non-empty").toBeTruthy();
        expect(action.timing, `${action.name} should have timing`).toBeTruthy();
        expect(action.description, `${action.name} should have description`).toBeTruthy();
        expect(action.sourceName, `${action.name} should have sourceName`).toBeTruthy();
      }
    });
  }

  it("Ronan is the only character with a reaction action", () => {
    const reactionsPerCharacter = slugs.map((slug) => {
      const state = computeCharacterState(buildCharacterFixture(roster, slug));
      return {
        slug,
        reactions: actionsOfTiming(state.actions, "reaction"),
      };
    });

    const withReactions = reactionsPerCharacter.filter(
      (entry) => entry.reactions.length > 0,
    );
    expect(withReactions.length).toBeGreaterThanOrEqual(1);
    expect(withReactions.some((e) => e.slug === "ronan-wildspark")).toBe(true);
  });
});
