/**
 * Familiar engine: Wild Companion summoning, familiar state lifecycle.
 *
 * Covers:
 * - Wild Companion: expend Wild Shape use or spell slot to cast Find Familiar
 * - Familiar state: active/dismissed, type, Wild Companion flag
 * - Familiar lifecycle: summon, dismiss, re-summon
 */

import type { EvaluatedTrait } from "../types/character.ts";
import type { SourceWithEffects } from "../types/effect.ts";

// ---------------------------------------------------------------------------
// Source detection
// ---------------------------------------------------------------------------

export function hasWildCompanion(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.entityId === "class-feature:wild-companion" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("wild companion")),
  );
}

// ---------------------------------------------------------------------------
// Familiar types (Find Familiar spirit forms)
// ---------------------------------------------------------------------------

export const FAMILIAR_FORMS = [
  "bat",
  "cat",
  "crab",
  "frog",
  "hawk",
  "lizard",
  "octopus",
  "owl",
  "poisonous snake",
  "fish",
  "rat",
  "raven",
  "sea horse",
  "spider",
  "weasel",
] as const;

export type FamiliarForm = (typeof FAMILIAR_FORMS)[number];

// ---------------------------------------------------------------------------
// Familiar state
// ---------------------------------------------------------------------------

export type FamiliarStatus = "active" | "dismissed" | "none";

export interface FamiliarState {
  status: FamiliarStatus;
  form: FamiliarForm | null;
  /** Whether this familiar was summoned via Wild Companion (Fey type, expires on long rest) */
  summonedViaWildCompanion: boolean;
  /** Timestamp when the familiar was summoned */
  summonedAt: string | null;
}

/**
 * Create the initial (no familiar) state.
 */
export function createEmptyFamiliarState(): FamiliarState {
  return {
    status: "none",
    form: null,
    summonedViaWildCompanion: false,
    summonedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Familiar lifecycle
// ---------------------------------------------------------------------------

/**
 * Summon a familiar via Wild Companion (expends Wild Shape use).
 * The familiar is Fey and disappears on a long rest.
 */
export function summonWildCompanionFamiliar(
  form: FamiliarForm,
  now?: string,
): FamiliarState {
  return {
    status: "active",
    form,
    summonedViaWildCompanion: true,
    summonedAt: now ?? new Date().toISOString(),
  };
}

/**
 * Summon a familiar via Find Familiar spell (normal casting).
 * The familiar is a Celestial, Fey, or Fiend (caster's choice).
 */
export function summonSpellFamiliar(
  form: FamiliarForm,
  now?: string,
): FamiliarState {
  return {
    status: "active",
    form,
    summonedViaWildCompanion: false,
    summonedAt: now ?? new Date().toISOString(),
  };
}

/**
 * Dismiss the familiar to a pocket dimension. It can be re-summoned later.
 */
export function dismissFamiliar(state: FamiliarState): FamiliarState {
  if (state.status !== "active") {
    return state;
  }

  return {
    ...state,
    status: "dismissed",
  };
}

/**
 * Re-summon a previously dismissed familiar.
 */
export function resummonFamiliar(state: FamiliarState): FamiliarState {
  if (state.status !== "dismissed") {
    return state;
  }

  return {
    ...state,
    status: "active",
  };
}

/**
 * Remove the familiar entirely (it is destroyed or the summoner dismisses it permanently).
 */
export function removeFamiliar(): FamiliarState {
  return createEmptyFamiliarState();
}

/**
 * Handle long rest for Wild Companion familiars: they disappear.
 * Normal familiars persist through long rests.
 */
export function handleFamiliarLongRest(state: FamiliarState): FamiliarState {
  if (state.summonedViaWildCompanion && state.status !== "none") {
    return createEmptyFamiliarState();
  }
  return state;
}

// ---------------------------------------------------------------------------
// Trait builders
// ---------------------------------------------------------------------------

/**
 * Build the Wild Companion trait for inclusion in character state.
 */
export function buildWildCompanionTrait(
  sources: SourceWithEffects[],
): EvaluatedTrait | null {
  if (!hasWildCompanion(sources)) {
    return null;
  }

  return {
    name: "Wild Companion",
    description:
      "Cast Find Familiar without material components by expending a spell slot or a use of Wild Shape. " +
      "The familiar is Fey and disappears when you finish a Long Rest.",
    tags: ["wild-companion", "action", "familiar", "fey"],
    sourceName: "Wild Companion",
  };
}
