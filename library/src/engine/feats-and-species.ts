/**
 * Feat and species mechanic resolution.
 *
 * This module provides functions that produce dynamic effects for feats
 * and species whose mechanics depend on character state (e.g., proficiency
 * bonus, ability modifiers). Static effects are defined in canon files;
 * this module handles the runtime-computed aspects.
 */

import type { AbilityScoreSet, EvaluatedTrait } from "../types/character.ts";
import type { Effect, SourceWithEffects } from "../types/effect.ts";
import type { EffectEnvelope } from "./shared.ts";

// ---------------------------------------------------------------------------
// Alert: +proficiency bonus to initiative
// ---------------------------------------------------------------------------

/**
 * Returns a modifier effect adding proficiency bonus to initiative for
 * a character with the Alert feat.
 */
export function buildAlertInitiativeModifier(
  sources: SourceWithEffects[],
  proficiencyBonus: number,
): Effect | null {
  const hasAlert = sources.some(
    (s) =>
      s.source.kind === "feat" &&
      (s.source.entityId === "feat:alert" ||
        s.source.name.toLowerCase() === "alert"),
  );

  if (!hasAlert) {
    return null;
  }

  return {
    type: "modifier",
    target: "initiative",
    value: proficiencyBonus,
    condition: undefined,
  };
}

// ---------------------------------------------------------------------------
// Savage Attacker: once-per-turn damage reroll (surface the option)
// ---------------------------------------------------------------------------

/**
 * Returns a trait describing the Savage Attacker reroll mechanic.
 * This is surfaced as a tactical reminder rather than auto-resolved,
 * since the player chooses when to use it.
 */
export function buildSavageAttackerTrait(
  sources: SourceWithEffects[],
): EvaluatedTrait | null {
  const source = sources.find(
    (s) =>
      s.source.kind === "feat" &&
      (s.source.entityId === "feat:savage-attacker" ||
        s.source.name.toLowerCase() === "savage attacker"),
  );

  if (!source) {
    return null;
  }

  return {
    name: "Savage Attacker",
    description:
      "Once per turn when you hit with a weapon, you can roll the weapon's damage dice twice and use either roll.",
    tags: ["once-per-turn", "melee-damage-reroll"],
    sourceName: source.source.name,
  };
}

// ---------------------------------------------------------------------------
// Skilled: proficiency grants from choice capture
// ---------------------------------------------------------------------------

/**
 * Returns proficiency effects for the Skilled feat based on persisted
 * sub-choices. The actual proficiencies are stored in the character's
 * skill choice state; this function extracts the skill names from the
 * feat's subChoicesJson payload.
 */
export function buildSkilledProficiencies(
  sources: SourceWithEffects[],
): Effect[] {
  const source = sources.find(
    (s) =>
      s.source.kind === "feat" &&
      (s.source.entityId === "feat:skilled" ||
        s.source.name.toLowerCase() === "skilled"),
  );

  if (!source) {
    return [];
  }

  const payload = source.source.payload;
  if (!payload) {
    return [];
  }

  const subChoices = payload["subChoicesJson"] as
    | { skillProficiencies?: string[] }
    | undefined;
  if (!subChoices?.skillProficiencies) {
    return [];
  }

  return subChoices.skillProficiencies.map((skill) => ({
    type: "proficiency" as const,
    category: "skill" as const,
    value: skill,
  }));
}

// ---------------------------------------------------------------------------
// Musician: short rest Bardic Inspiration recovery
// ---------------------------------------------------------------------------

/**
 * Describes the Musician feat's short-rest benefit: when a Bard with
 * Musician finishes a short rest, Bardic Inspiration uses are restored.
 * This is surfaced as a trait since the actual resource reset is handled
 * by the rest engine (Bardic Inspiration pool should reset on short
 * rest when the character has the Musician feat).
 */
export function hasMusicianFeat(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.kind === "feat" &&
      (s.source.entityId === "feat:musician" ||
        s.source.name.toLowerCase() === "musician"),
  );
}

/**
 * If the character has Musician, Bardic Inspiration should reset on
 * short rest instead of only long rest. This returns the modified
 * reset type for the Bardic Inspiration resource.
 */
export function getBardicInspirationResetType(
  sources: SourceWithEffects[],
): "short" | "long" {
  return hasMusicianFeat(sources) ? "short" : "long";
}

// ---------------------------------------------------------------------------
// Magic Initiate: choice capture + free cast tracking
// ---------------------------------------------------------------------------

/**
 * Returns spell access effects for Magic Initiate based on persisted
 * sub-choices. The chosen cantrips and level 1 spell are stored in
 * the feat's subChoicesJson payload.
 */
export function buildMagicInitiateEffects(
  sources: SourceWithEffects[],
): Effect[] {
  const source = sources.find(
    (s) =>
      s.source.kind === "feat" &&
      (s.source.entityId === "feat:magic-initiate" ||
        s.source.name.toLowerCase().startsWith("magic initiate")),
  );

  if (!source) {
    return [];
  }

  const effects: Effect[] = [];

  const payload = source.source.payload;
  const subChoices = payload?.["subChoicesJson"] as
    | {
        spellList?: string;
        cantrips?: string[];
        level1Spell?: string;
      }
    | undefined;

  if (subChoices?.cantrips) {
    for (const cantrip of subChoices.cantrips) {
      effects.push({
        type: "grant-spell-access",
        spell: {
          spellName: cantrip,
          alwaysPrepared: true,
          source: `Magic Initiate (${subChoices.spellList ?? "unknown"})`,
        },
      });
    }
  }

  if (subChoices?.level1Spell) {
    effects.push({
      type: "grant-spell-access",
      spell: {
        spellName: subChoices.level1Spell,
        alwaysPrepared: true,
        source: `Magic Initiate (${subChoices.spellList ?? "unknown"})`,
      },
    });
  }

  // Free cast resource is already in the canon effects
  return effects;
}

// ---------------------------------------------------------------------------
// Goliath: Stone's Endurance resource pool
// ---------------------------------------------------------------------------

/**
 * Validates that a Goliath character has Stone's Endurance as a
 * scaling resource pool. The canon effects already express this as a
 * grant-scaling-resource; this function is for verification.
 */
export function hasStoneEndurance(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.kind === "species" &&
      (s.source.entityId === "species:goliath" ||
        s.source.name.toLowerCase() === "goliath") &&
      s.effects.some(
        (e) =>
          e.type === "grant-scaling-resource" &&
          e.resource.name === "Stone's Endurance",
      ),
  );
}

/**
 * Compute Stone's Endurance reduction value string for display.
 */
export function stonesEnduranceReduction(
  abilityScores: AbilityScoreSet,
): string {
  const conMod = Math.floor((abilityScores.constitution - 10) / 2);
  return `1d12+${conMod}`;
}

// ---------------------------------------------------------------------------
// Drow: lineage spells and Fey Ancestry
// ---------------------------------------------------------------------------

/**
 * Returns whether a character has the Drow Fey Ancestry trait
 * (advantage on saves vs charmed).
 */
export function hasDrowFeyAncestry(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.kind === "species" &&
      (s.source.entityId === "species:drow" ||
        s.source.name.toLowerCase() === "drow") &&
      s.effects.some(
        (e) =>
          e.type === "grant-trait" &&
          e.trait.name === "Fey Ancestry",
      ),
  );
}

/**
 * Returns whether a character has Drow lineage Dancing Lights cantrip.
 */
export function hasDrowDancingLights(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      (s.source.entityId === "species:drow" ||
        s.source.name.toLowerCase() === "drow") &&
      s.effects.some(
        (e) =>
          e.type === "grant-spell-access" &&
          e.spell.spellName === "Dancing Lights",
      ),
  );
}

/**
 * Returns whether a character has Drow Faerie Fire free cast resource.
 */
export function hasDrowFaerieFireFreeCast(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      (s.source.entityId === "species:drow" ||
        s.source.name.toLowerCase() === "drow") &&
      s.effects.some(
        (e) =>
          e.type === "grant-resource" &&
          e.resource.name === "Drow Faerie Fire Free Cast",
      ),
  );
}

// ---------------------------------------------------------------------------
// Wood Elf: speed bonus, Druidcraft, Trance
// ---------------------------------------------------------------------------

/**
 * Returns whether a character has the Wood Elf +5 speed bonus in their
 * source effects.
 */
export function hasWoodElfSpeedBonus(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      (s.source.entityId === "species:wood-elf" ||
        s.source.name.toLowerCase() === "wood elf") &&
      s.effects.some(
        (e) => e.type === "speed-bonus" && e.value === 5 && e.movementType === "walk",
      ),
  );
}

/**
 * Returns whether a character has Wood Elf Druidcraft cantrip access.
 */
export function hasWoodElfDruidcraft(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      (s.source.entityId === "species:wood-elf" ||
        s.source.name.toLowerCase() === "wood elf") &&
      s.effects.some(
        (e) =>
          e.type === "grant-spell-access" &&
          e.spell.spellName === "Druidcraft",
      ),
  );
}

/**
 * Returns whether a character has the Wood Elf Trance trait (4-hour long rest).
 */
export function hasWoodElfTrance(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      (s.source.entityId === "species:wood-elf" ||
        s.source.name.toLowerCase() === "wood elf") &&
      s.effects.some(
        (e) =>
          e.type === "grant-trait" &&
          e.trait.name === "Trance",
      ),
  );
}

// ---------------------------------------------------------------------------
// Aggregate: build all feat/species dynamic effects for a character
// ---------------------------------------------------------------------------

/**
 * Builds additional dynamic effects from feat and species mechanics that
 * depend on character state. These supplement the static effects defined
 * in canon files.
 */
export function buildFeatAndSpeciesDynamicEffects(
  sources: SourceWithEffects[],
  proficiencyBonus: number,
): EffectEnvelope[] {
  const envelopes: EffectEnvelope[] = [];

  // Alert: initiative = +proficiency bonus
  const alertEffect = buildAlertInitiativeModifier(sources, proficiencyBonus);
  if (alertEffect) {
    envelopes.push({
      sourceName: "Alert",
      sourceDescription: "Alert feat initiative bonus",
      effect: alertEffect,
    });
  }

  // Skilled: dynamic proficiency grants from choice state
  const skilledEffects = buildSkilledProficiencies(sources);
  for (const effect of skilledEffects) {
    envelopes.push({
      sourceName: "Skilled",
      sourceDescription: "Skilled feat proficiency grant",
      effect,
    });
  }

  // Magic Initiate: spell access from choice state
  const magicInitiateEffects = buildMagicInitiateEffects(sources);
  for (const effect of magicInitiateEffects) {
    envelopes.push({
      sourceName: "Magic Initiate",
      sourceDescription: "Magic Initiate feat spell access",
      effect,
    });
  }

  return envelopes;
}
