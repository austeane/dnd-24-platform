/**
 * Wild Shape engine: resource pool, beast form library, transform state.
 *
 * Covers:
 * - Wild Shape uses: PB uses per long rest (2024 SRD rules reset on short rest)
 * - Beast form library: level-appropriate forms with stat blocks
 * - Transform state: tracking current form, temp HP, duration
 * - Revert mechanics: excess damage carry-over
 */

import type {
  AbilityScoreSet,
  EvaluatedTrait,
  ResourcePoolDefinition,
} from "../types/character.ts";
import type { SourceWithEffects } from "../types/effect.ts";

// ---------------------------------------------------------------------------
// Source detection
// ---------------------------------------------------------------------------

export function hasWildShape(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.entityId === "class-feature:wild-shape" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("wild shape")),
  );
}

// ---------------------------------------------------------------------------
// Resource pool computation
// ---------------------------------------------------------------------------

/**
 * Wild Shape uses = 2 (fixed per 2024 SRD), resets on short rest.
 * The 2024 SRD grants 2 uses at level 2, unchanged by level.
 */
export function computeWildShapeMaxUses(): number {
  return 2;
}

/**
 * Build the Wild Shape resource pool definition for persistence integration.
 */
export function buildWildShapePoolDefinition(
  sources: SourceWithEffects[],
): ResourcePoolDefinition | null {
  if (!hasWildShape(sources)) {
    return null;
  }

  return {
    resourceName: "Wild Shape",
    maxUses: computeWildShapeMaxUses(),
    resetOn: "short",
    sourceName: "Wild Shape",
  };
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

/**
 * Wild Shape duration in hours = floor(druid level / 2).
 * Minimum 1 hour at level 2.
 */
export function computeWildShapeDuration(druidLevel: number): number {
  return Math.max(Math.floor(druidLevel / 2), 1);
}

// ---------------------------------------------------------------------------
// Beast form library
// ---------------------------------------------------------------------------

export interface BeastFormStats {
  name: string;
  cr: string;
  abilityScores: AbilityScoreSet;
  armorClass: number;
  hitPoints: number;
  speed: number;
  swimSpeed?: number;
  climbSpeed?: number;
  flySpeed?: number;
  attacks: BeastFormAttack[];
  senses: string[];
  traits: string[];
}

export interface BeastFormAttack {
  name: string;
  attackBonus: number;
  damageDice: string;
  damageType: string;
}

/**
 * Level-appropriate beast forms for a druid (CR 1/4 at level 2-3, CR 1/2 at 4-7, CR 1 at 8+).
 * At level 2, druids know four forms without a fly speed.
 */
export const BEAST_FORM_LIBRARY: ReadonlyArray<BeastFormStats> = [
  {
    name: "Wolf",
    cr: "1/4",
    abilityScores: {
      strength: 12,
      dexterity: 15,
      constitution: 12,
      intelligence: 3,
      wisdom: 12,
      charisma: 6,
    },
    armorClass: 13,
    hitPoints: 11,
    speed: 40,
    attacks: [
      {
        name: "Bite",
        attackBonus: 4,
        damageDice: "2d4+2",
        damageType: "piercing",
      },
    ],
    senses: ["Perception +3", "Stealth +4"],
    traits: ["Keen Hearing and Smell", "Pack Tactics"],
  },
  {
    name: "Cat",
    cr: "0",
    abilityScores: {
      strength: 3,
      dexterity: 15,
      constitution: 10,
      intelligence: 3,
      wisdom: 12,
      charisma: 7,
    },
    armorClass: 12,
    hitPoints: 2,
    speed: 40,
    climbSpeed: 30,
    attacks: [
      {
        name: "Claws",
        attackBonus: 0,
        damageDice: "1",
        damageType: "slashing",
      },
    ],
    senses: ["Darkvision 30 ft", "Perception +3", "Stealth +4"],
    traits: ["Keen Smell"],
  },
  {
    name: "Giant Spider",
    cr: "1",
    abilityScores: {
      strength: 14,
      dexterity: 16,
      constitution: 12,
      intelligence: 2,
      wisdom: 11,
      charisma: 4,
    },
    armorClass: 14,
    hitPoints: 26,
    speed: 30,
    climbSpeed: 30,
    attacks: [
      {
        name: "Bite",
        attackBonus: 5,
        damageDice: "1d8+3",
        damageType: "piercing",
      },
    ],
    senses: ["Blindsight 10 ft", "Darkvision 60 ft", "Perception +3"],
    traits: ["Spider Climb", "Web Sense", "Web Walker"],
  },
  {
    name: "Draft Horse",
    cr: "1/4",
    abilityScores: {
      strength: 18,
      dexterity: 10,
      constitution: 12,
      intelligence: 2,
      wisdom: 11,
      charisma: 7,
    },
    armorClass: 10,
    hitPoints: 19,
    speed: 40,
    attacks: [
      {
        name: "Hooves",
        attackBonus: 6,
        damageDice: "2d4+4",
        damageType: "bludgeoning",
      },
    ],
    senses: ["Perception +2"],
    traits: [],
  },
];

/**
 * Get beast forms available at the given druid level.
 * Level 2-3: CR <= 1/4, no fly speed.
 * Level 4-7: CR <= 1/2, no fly speed.
 * Level 8+: CR <= 1.
 */
export function getAvailableBeastForms(druidLevel: number): BeastFormStats[] {
  const maxCr = druidLevel >= 8 ? 1 : druidLevel >= 4 ? 0.5 : 0.25;
  const allowFly = druidLevel >= 8;

  return BEAST_FORM_LIBRARY.filter((form) => {
    const numericCr = parseCr(form.cr);
    if (numericCr > maxCr) return false;
    if (!allowFly && form.flySpeed) return false;
    return true;
  });
}

function parseCr(cr: string): number {
  if (cr.includes("/")) {
    const [numerator, denominator] = cr.split("/");
    return Number(numerator) / Number(denominator);
  }
  return Number(cr);
}

// ---------------------------------------------------------------------------
// Transform state
// ---------------------------------------------------------------------------

export interface WildShapeTransformState {
  isTransformed: boolean;
  beastForm: BeastFormStats | null;
  tempHitPoints: number;
  durationHours: number;
  /** Timestamp when the transform started, for duration tracking */
  transformedAt: string | null;
}

/**
 * Create the initial (not transformed) wild shape state.
 */
export function createIdleWildShapeState(): WildShapeTransformState {
  return {
    isTransformed: false,
    beastForm: null,
    tempHitPoints: 0,
    durationHours: 0,
    transformedAt: null,
  };
}

/**
 * Transform into a beast form.
 * Temp HP from beast form = druid level (2024 SRD).
 */
export function transformIntoBeast(
  beastForm: BeastFormStats,
  druidLevel: number,
  now?: string,
): WildShapeTransformState {
  return {
    isTransformed: true,
    beastForm,
    tempHitPoints: druidLevel,
    durationHours: computeWildShapeDuration(druidLevel),
    transformedAt: now ?? new Date().toISOString(),
  };
}

/**
 * Revert from beast form. Returns excess damage that carries over.
 */
export function revertFromBeast(
  state: WildShapeTransformState,
  damageTaken?: number,
): { newState: WildShapeTransformState; excessDamage: number } {
  const excessDamage =
    damageTaken !== undefined
      ? Math.max(damageTaken - state.tempHitPoints, 0)
      : 0;

  return {
    newState: createIdleWildShapeState(),
    excessDamage,
  };
}

// ---------------------------------------------------------------------------
// Trait builders
// ---------------------------------------------------------------------------

/**
 * Build the Wild Shape trait for inclusion in character state.
 */
export function buildWildShapeTrait(
  sources: SourceWithEffects[],
  druidLevel: number,
): EvaluatedTrait | null {
  if (!hasWildShape(sources)) {
    return null;
  }

  const duration = computeWildShapeDuration(druidLevel);
  const maxUses = computeWildShapeMaxUses();
  const forms = getAvailableBeastForms(druidLevel);

  return {
    name: "Wild Shape",
    description:
      `Bonus action to shape-shift into a known beast form for up to ${duration} hour(s). ` +
      `${maxUses} uses per short rest. Gain temp HP equal to druid level (${druidLevel}). ` +
      `${forms.length} beast form(s) available at this level.`,
    tags: ["wild-shape", "bonus-action", "transform"],
    sourceName: "Wild Shape",
  };
}
