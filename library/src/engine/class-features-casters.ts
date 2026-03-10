/**
 * Caster class feature mechanics: Warlock, Bard, and Sorcerer.
 *
 * Covers:
 * - Magical Cunning (Warlock): surface + recovery computation
 * - Pact of the Blade: bond state + Charisma substitution for attacks
 * - Bardic Inspiration: resource pool, die scaling, spend tracking
 * - Font of Magic: sorcery point pool scaling
 * - Metamagic: option surface from choice-state, cast modifier descriptions
 */

import type {
  AbilityScoreSet,
  AttackAbility,
  AttackProfile,
  EvaluatedTrait,
  ResourcePoolDefinition,
} from "../types/character.ts";
import type { SourceWithEffects } from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import { derivePactMagicSlots } from "./spellcasting.ts";
import { getBardicInspirationResetType } from "./feats-and-species.ts";
import type { EffectEnvelope } from "./shared.ts";

// ---------------------------------------------------------------------------
// Magical Cunning (Warlock) — surface + recovery
// ---------------------------------------------------------------------------

/**
 * Check whether the character has the Magical Cunning feature.
 */
export function hasMagicalCunning(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.entityId === "class-feature:magical-cunning" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("magical cunning")),
  );
}

/**
 * Compute how many pact slots Magical Cunning can recover.
 * Rule: regain up to half your maximum pact slots (rounded up).
 */
export function computeMagicalCunningRecovery(warlockLevel: number): number {
  const { count } = derivePactMagicSlots(warlockLevel);
  return Math.ceil(count / 2);
}

/**
 * Build the Magical Cunning trait with recovery details for a given warlock level.
 */
export function buildMagicalCunningTrait(
  sources: SourceWithEffects[],
  warlockLevel: number,
): EvaluatedTrait | null {
  if (!hasMagicalCunning(sources)) {
    return null;
  }

  const recovery = computeMagicalCunningRecovery(warlockLevel);

  return {
    name: "Magical Cunning",
    description:
      `Spend 1 minute to recover up to ${recovery} expended Pact Magic slot(s). Usable once per Long Rest.`,
    tags: ["1-minute-rite", "slot-recovery", "once-per-long-rest"],
    sourceName: "Magical Cunning",
  };
}

// ---------------------------------------------------------------------------
// Pact of the Blade — bond state + Charisma substitution
// ---------------------------------------------------------------------------

/**
 * Check whether the character has Pact of the Blade.
 */
export function hasPactOfTheBlade(sources: SourceWithEffects[]): boolean {
  return sources.some(
    (s) =>
      s.source.entityId === "class-feature:pact-of-the-blade" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("pact of the blade")),
  );
}

/**
 * Extract pact blade bond info from sources. The bond is stored in
 * the source payload by the choice-state system.
 */
export interface PactBladeBondInfo {
  weaponLabel: string;
  weaponEntityId: string | undefined;
  isMagicWeapon: boolean;
}

export function extractPactBladeBond(
  sources: SourceWithEffects[],
): PactBladeBondInfo | null {
  const pactSource = sources.find(
    (s) =>
      s.source.entityId === "class-feature:pact-of-the-blade" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("pact of the blade")),
  );

  if (!pactSource) {
    return null;
  }

  const payload = pactSource.source.payload;
  if (!payload) {
    return null;
  }

  const bond = payload["pactBladeBond"] as
    | {
        weaponLabel?: string;
        weaponEntityId?: string;
        isMagicWeapon?: boolean;
      }
    | undefined;

  if (!bond?.weaponLabel) {
    return null;
  }

  return {
    weaponLabel: bond.weaponLabel,
    weaponEntityId: bond.weaponEntityId,
    isMagicWeapon: bond.isMagicWeapon ?? false,
  };
}

/**
 * Apply Charisma substitution to an attack profile for a pact blade weapon.
 * The Warlock can use Charisma instead of Strength or Dexterity for
 * attack and damage rolls with their bonded pact weapon.
 *
 * Returns a new profile with charisma-based attack/damage if CHA is better,
 * or the original profile unchanged.
 */
export function applyPactBladeCharismaSubstitution(
  profile: AttackProfile,
  abilityScores: AbilityScoreSet,
  bondedWeaponEntityId: string | undefined,
  proficiencyBonus: number,
): AttackProfile {
  // Only applies to the bonded weapon
  if (!bondedWeaponEntityId || profile.weaponEntityId !== bondedWeaponEntityId) {
    return profile;
  }

  const chaMod = getAbilityModifier(abilityScores.charisma);
  const currentAbilityMod = getAbilityModifier(abilityScores[profile.ability]);

  // Only substitute if Charisma is better
  if (chaMod <= currentAbilityMod) {
    return profile;
  }

  const profBonus = profile.isProficient ? proficiencyBonus : 0;
  const attackBonus = chaMod + profBonus;

  return {
    ...profile,
    ability: "charisma" as AttackAbility,
    attackBonus,
    attackExplanation: {
      total: attackBonus,
      contributors: [
        { sourceName: "Charisma (Pact Weapon)", value: chaMod, condition: undefined },
        ...(profile.isProficient
          ? [{ sourceName: "Proficiency", value: profBonus, condition: undefined }]
          : []),
      ],
    },
    damageBonus: chaMod,
  };
}

// ---------------------------------------------------------------------------
// Bardic Inspiration — resource pool, die scaling, spend tracking
// ---------------------------------------------------------------------------

/**
 * Bardic Inspiration die size by bard level.
 * d6 at 1, d8 at 5, d10 at 10, d12 at 15.
 */
export function getBardicInspirationDie(bardLevel: number): string {
  if (bardLevel >= 15) return "d12";
  if (bardLevel >= 10) return "d10";
  if (bardLevel >= 5) return "d8";
  return "d6";
}

/**
 * Compute the max uses for Bardic Inspiration.
 * Equal to Charisma modifier (minimum 1).
 */
export function computeBardicInspirationMaxUses(
  abilityScores: AbilityScoreSet,
): number {
  return Math.max(getAbilityModifier(abilityScores.charisma), 1);
}

/**
 * Build the Bardic Inspiration resource pool definition.
 * Accounts for Musician feat (changes reset to short rest).
 */
export function buildBardicInspirationPool(
  sources: SourceWithEffects[],
  abilityScores: AbilityScoreSet,
): ResourcePoolDefinition | null {
  const hasBardic = sources.some(
    (s) =>
      s.source.entityId === "class-feature:bardic-inspiration" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("bardic inspiration")),
  );

  if (!hasBardic) {
    return null;
  }

  return {
    resourceName: "Bardic Inspiration",
    maxUses: computeBardicInspirationMaxUses(abilityScores),
    resetOn: getBardicInspirationResetType(sources),
    sourceName: "Bardic Inspiration",
  };
}

/**
 * Build the Bardic Inspiration die scaling trait for display.
 */
export function buildBardicInspirationDieTrait(
  sources: SourceWithEffects[],
  bardLevel: number,
): EvaluatedTrait | null {
  const hasBardic = sources.some(
    (s) =>
      s.source.entityId === "class-feature:bardic-inspiration" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("bardic inspiration")),
  );

  if (!hasBardic) {
    return null;
  }

  const die = getBardicInspirationDie(bardLevel);

  return {
    name: "Bardic Inspiration Die",
    description: `Your Bardic Inspiration die is a ${die}.`,
    tags: ["die-scaling", `die-${die}`],
    sourceName: "Bardic Inspiration",
  };
}

// ---------------------------------------------------------------------------
// Font of Magic — sorcery point pool scaling
// ---------------------------------------------------------------------------

/**
 * Compute Sorcery Points max for a given sorcerer level.
 * Equal to sorcerer level.
 */
export function computeSorceryPointsMax(sorcererLevel: number): number {
  return Math.max(sorcererLevel, 0);
}

/**
 * Sorcery Point to Spell Slot conversion cost table.
 * Slot level -> sorcery point cost to create.
 */
export const SORCERY_POINT_SLOT_COST: ReadonlyMap<number, number> = new Map([
  [1, 2],
  [2, 3],
  [3, 5],
  [4, 6],
  [5, 7],
]);

/**
 * Build the Font of Magic resource pool definition.
 */
export function buildFontOfMagicPool(
  sources: SourceWithEffects[],
  sorcererLevel: number,
): ResourcePoolDefinition | null {
  const hasFontOfMagic = sources.some(
    (s) =>
      s.source.entityId === "class-feature:font-of-magic" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("font of magic")),
  );

  if (!hasFontOfMagic) {
    return null;
  }

  return {
    resourceName: "Sorcery Points",
    maxUses: computeSorceryPointsMax(sorcererLevel),
    resetOn: "long",
    sourceName: "Font of Magic",
  };
}

/**
 * Build the Font of Magic conversion trait for display.
 */
export function buildFontOfMagicConversionTrait(
  sources: SourceWithEffects[],
  sorcererLevel: number,
): EvaluatedTrait | null {
  const hasFontOfMagic = sources.some(
    (s) =>
      s.source.entityId === "class-feature:font-of-magic" ||
      (s.source.kind === "class-feature" &&
        s.source.name.toLowerCase().includes("font of magic")),
  );

  if (!hasFontOfMagic) {
    return null;
  }

  const maxSlotLevel = sorcererLevel >= 9 ? 5
    : sorcererLevel >= 7 ? 4
    : sorcererLevel >= 5 ? 3
    : sorcererLevel >= 3 ? 2
    : 1;

  return {
    name: "Font of Magic Conversion",
    description:
      `Convert Sorcery Points to spell slots (up to level ${maxSlotLevel}) or expend spell slots to gain Sorcery Points equal to the slot's level.`,
    tags: ["conversion", "sorcery-points", "spell-slots"],
    sourceName: "Font of Magic",
  };
}

// ---------------------------------------------------------------------------
// Metamagic — option surface + cast modifier descriptions
// ---------------------------------------------------------------------------

/** Known metamagic options and their sorcery point costs and descriptions */
export interface MetamagicOption {
  name: string;
  sorceryPointCost: number;
  description: string;
  tags: string[];
}

export const METAMAGIC_OPTIONS: ReadonlyMap<string, MetamagicOption> = new Map([
  ["Careful Spell", {
    name: "Careful Spell",
    sorceryPointCost: 1,
    description: "Choose up to your Charisma modifier creatures; they automatically succeed on the spell's saving throw.",
    tags: ["save-protection"],
  }],
  ["Distant Spell", {
    name: "Distant Spell",
    sorceryPointCost: 1,
    description: "Double the range of a spell with a range of 5+ feet, or make a Touch spell have a range of 30 feet.",
    tags: ["range-extension"],
  }],
  ["Empowered Spell", {
    name: "Empowered Spell",
    sorceryPointCost: 1,
    description: "Reroll up to your Charisma modifier damage dice and use the new rolls.",
    tags: ["damage-reroll"],
  }],
  ["Extended Spell", {
    name: "Extended Spell",
    sorceryPointCost: 1,
    description: "Double the duration of a spell that has a duration of 1 minute or longer, up to 24 hours.",
    tags: ["duration-extension"],
  }],
  ["Heightened Spell", {
    name: "Heightened Spell",
    sorceryPointCost: 3,
    description: "One target of the spell has disadvantage on its first saving throw against the spell.",
    tags: ["save-disadvantage"],
  }],
  ["Quickened Spell", {
    name: "Quickened Spell",
    sorceryPointCost: 2,
    description: "Change the casting time of a spell from an action to a bonus action.",
    tags: ["casting-time-reduction"],
  }],
  ["Seeking Spell", {
    name: "Seeking Spell",
    sorceryPointCost: 1,
    description: "If you miss with a spell attack, you can reroll the d20 and must use the new roll.",
    tags: ["attack-reroll"],
  }],
  ["Subtle Spell", {
    name: "Subtle Spell",
    sorceryPointCost: 1,
    description: "Cast a spell without verbal or somatic components.",
    tags: ["no-components"],
  }],
  ["Transmuted Spell", {
    name: "Transmuted Spell",
    sorceryPointCost: 1,
    description: "Change the damage type of a spell to acid, cold, fire, lightning, poison, or thunder.",
    tags: ["damage-type-change"],
  }],
  ["Twinned Spell", {
    name: "Twinned Spell",
    sorceryPointCost: 1,
    description: "When you cast a spell that targets only one creature and doesn't have a range of Self, spend additional sorcery points equal to the spell's level (1 minimum) to target a second creature.",
    tags: ["target-duplication", "variable-cost"],
  }],
]);

/**
 * Extract metamagic choices from sources. Looks for payload.metamagicChoices
 * on sorcerer-related sources.
 */
export function extractMetamagicChoices(
  sources: SourceWithEffects[],
): string[] {
  for (const { source } of sources) {
    const payload = source.payload;
    if (!payload) continue;

    const choices = payload["metamagicChoices"];
    if (Array.isArray(choices)) {
      return choices.filter((c): c is string => typeof c === "string");
    }
  }

  return [];
}

/**
 * Build metamagic traits for the character's chosen options.
 */
export function buildMetamagicTraits(
  sources: SourceWithEffects[],
): EvaluatedTrait[] {
  const chosenOptions = extractMetamagicChoices(sources);

  return chosenOptions.flatMap((optionName) => {
    const option = METAMAGIC_OPTIONS.get(optionName);
    if (!option) {
      return [];
    }

    return [{
      name: option.name,
      description: `${option.description} (${option.sorceryPointCost} Sorcery Point${option.sorceryPointCost > 1 ? "s" : ""})`,
      tags: ["metamagic", ...option.tags],
      sourceName: "Metamagic",
    }];
  });
}

/**
 * Get the sorcery point cost for applying a specific metamagic option.
 * For Twinned Spell, the cost is the spell's level (minimum 1) in
 * addition to the base cost.
 */
export function getMetamagicCost(
  optionName: string,
  spellLevel?: number,
): number | null {
  const option = METAMAGIC_OPTIONS.get(optionName);
  if (!option) {
    return null;
  }

  if (optionName === "Twinned Spell" && spellLevel !== undefined) {
    return Math.max(spellLevel, 1);
  }

  return option.sorceryPointCost;
}

// ---------------------------------------------------------------------------
// Aggregate: build all caster class feature effects for a character
// ---------------------------------------------------------------------------

/**
 * Resolve the class level for a specific class from sources.
 */
export function getClassLevel(
  sources: SourceWithEffects[],
  classId: string,
): number {
  let maxRank = 0;
  for (const { source } of sources) {
    if (source.kind !== "class-level") continue;
    const normalizedName = source.name.toLowerCase();
    if (normalizedName.startsWith(classId.toLowerCase())) {
      const rank = source.rank ?? 0;
      if (rank > maxRank) {
        maxRank = rank;
      }
    }
  }
  return maxRank;
}

/**
 * Build all caster class feature dynamic effects for a character.
 * These are runtime-computed effects that supplement the static canon effects.
 */
export function buildCasterClassFeatureEffects(
  sources: SourceWithEffects[],
): EffectEnvelope[] {
  const envelopes: EffectEnvelope[] = [];

  // Warlock: Magical Cunning resource pool (already in canon effects)
  // Warlock: Pact Blade Charisma substitution is applied at attack profile level

  // Bard: Bardic Inspiration die scaling
  const bardLevel = getClassLevel(sources, "bard");
  if (bardLevel > 0) {
    const dieTrait = buildBardicInspirationDieTrait(sources, bardLevel);
    if (dieTrait) {
      envelopes.push({
        sourceName: "Bardic Inspiration",
        sourceDescription: "Bardic Inspiration die scaling",
        effect: {
          type: "grant-trait",
          trait: {
            name: dieTrait.name,
            description: dieTrait.description,
            tags: dieTrait.tags,
          },
        },
      });
    }
  }

  // Sorcerer: Metamagic traits from choice capture
  const metamagicTraits = buildMetamagicTraits(sources);
  for (const trait of metamagicTraits) {
    envelopes.push({
      sourceName: "Metamagic",
      sourceDescription: "Metamagic option from choice capture",
      effect: {
        type: "grant-trait",
        trait: {
          name: trait.name,
          description: trait.description,
          tags: trait.tags,
        },
      },
    });
  }

  return envelopes;
}
