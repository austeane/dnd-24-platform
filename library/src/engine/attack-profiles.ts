import type {
  AbilityName,
  AttackAbility,
  AttackProfile,
  CharacterComputationInput,
  CharacterProficiencySet,
} from "../types/character.ts";
import { getAbilityModifier } from "./math.ts";
import {
  createExplanation,
  getNumericModifierContributors,
  type EffectEnvelope,
} from "./shared.ts";

/**
 * Static weapon data registry. Keyed by entity ID (e.g. "equipment:longsword").
 * This is the authoritative source for weapon statistics used in attack profile
 * computation. Covers roster weapons and common SRD weapons.
 */
export interface WeaponData {
  entityId: string;
  name: string;
  category: "simple" | "martial";
  attackType: "melee" | "ranged";
  damageDice: string;
  damageType: string;
  properties: string[];
  /** Normal/max range for thrown or ranged weapons, e.g. "30/120" */
  range: string | undefined;
  masteryProperty: string;
}

const WEAPON_REGISTRY: ReadonlyMap<string, WeaponData> = new Map([
  ["equipment:longsword", {
    entityId: "equipment:longsword",
    name: "Longsword",
    category: "martial",
    attackType: "melee",
    damageDice: "1d8",
    damageType: "slashing",
    properties: ["Versatile (1d10)"],
    range: undefined,
    masteryProperty: "Sap",
  }],
  ["equipment:javelin", {
    entityId: "equipment:javelin",
    name: "Javelin",
    category: "simple",
    attackType: "melee",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["Thrown (30/120)"],
    range: "30/120",
    masteryProperty: "Slow",
  }],
  ["equipment:rapier", {
    entityId: "equipment:rapier",
    name: "Rapier",
    category: "martial",
    attackType: "melee",
    damageDice: "1d8",
    damageType: "piercing",
    properties: ["Finesse"],
    range: undefined,
    masteryProperty: "Vex",
  }],
  ["equipment:dagger", {
    entityId: "equipment:dagger",
    name: "Dagger",
    category: "simple",
    attackType: "melee",
    damageDice: "1d4",
    damageType: "piercing",
    properties: ["Finesse", "Light", "Thrown (20/60)"],
    range: "20/60",
    masteryProperty: "Nick",
  }],
  ["equipment:quarterstaff", {
    entityId: "equipment:quarterstaff",
    name: "Quarterstaff",
    category: "simple",
    attackType: "melee",
    damageDice: "1d6",
    damageType: "bludgeoning",
    properties: ["Versatile (1d8)"],
    range: undefined,
    masteryProperty: "Topple",
  }],
  ["equipment:shortsword", {
    entityId: "equipment:shortsword",
    name: "Shortsword",
    category: "martial",
    attackType: "melee",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["Finesse", "Light"],
    range: undefined,
    masteryProperty: "Vex",
  }],
  ["equipment:scimitar", {
    entityId: "equipment:scimitar",
    name: "Scimitar",
    category: "martial",
    attackType: "melee",
    damageDice: "1d6",
    damageType: "slashing",
    properties: ["Finesse", "Light"],
    range: undefined,
    masteryProperty: "Nick",
  }],
  ["equipment:longbow", {
    entityId: "equipment:longbow",
    name: "Longbow",
    category: "martial",
    attackType: "ranged",
    damageDice: "1d8",
    damageType: "piercing",
    properties: ["Ammunition (150/600; Arrow)", "Heavy", "Two-Handed"],
    range: "150/600",
    masteryProperty: "Slow",
  }],
]);

/** Expose the registry for testing */
export function getWeaponData(entityId: string): WeaponData | undefined {
  return WEAPON_REGISTRY.get(entityId);
}

/** Check if a weapon has the Finesse property */
function isFinesse(weapon: WeaponData): boolean {
  return weapon.properties.some((p) => p === "Finesse");
}

/** Check if a weapon has the Thrown property */
function isThrown(weapon: WeaponData): boolean {
  return weapon.properties.some((p) => p.startsWith("Thrown"));
}

/**
 * Determine the best attack ability for a weapon.
 * - Ranged weapons use DEX
 * - Finesse weapons use the higher of STR or DEX
 * - Melee weapons use STR
 */
function resolveAttackAbility(
  weapon: WeaponData,
  abilityScores: Record<AbilityName, number>,
): AttackAbility {
  if (weapon.attackType === "ranged") {
    return "dexterity";
  }
  if (isFinesse(weapon)) {
    const str = getAbilityModifier(abilityScores.strength);
    const dex = getAbilityModifier(abilityScores.dexterity);
    return dex >= str ? "dexterity" : "strength";
  }
  return "strength";
}

/**
 * Check if a character is proficient with a weapon.
 * Matches by weapon name, category ("simple", "martial"), or "simple weapons"/"martial weapons".
 */
function isProficientWithWeapon(
  weapon: WeaponData,
  proficiencies: CharacterProficiencySet,
): boolean {
  const lowerProfs = proficiencies.weapons.map((w) => w.toLowerCase());
  const weaponNameLower = weapon.name.toLowerCase();

  if (lowerProfs.includes(weaponNameLower)) {
    return true;
  }
  if (lowerProfs.includes(`${weapon.category} weapons`)) {
    return true;
  }
  if (lowerProfs.includes(weapon.category)) {
    return true;
  }
  if (weapon.category === "simple" && lowerProfs.includes("simple weapons")) {
    return true;
  }
  if (weapon.category === "martial" && lowerProfs.includes("martial weapons")) {
    return true;
  }
  return false;
}

/**
 * Input for weapon mastery: pairs a weapon entity ID with the mastery property
 * the character has selected for it.
 */
export interface WeaponMasteryChoice {
  weaponEntityId: string;
  masteryProperty: string;
}

/**
 * Build attack profiles for all equipped weapons on a character.
 *
 * Scans sources for equipment-kind sources whose entityId is in the weapon
 * registry, then computes attack bonus, damage, and mastery tags.
 */
export function buildAttackProfiles(
  input: CharacterComputationInput,
  effects: EffectEnvelope[],
  proficiencyBonus: number,
  proficiencies: CharacterProficiencySet,
): AttackProfile[] {
  const weaponMasteryChoices = extractWeaponMasteryChoices(input);
  const hasWeaponMasteryFeature = checkHasWeaponMasteryFeature(input);
  const meleeModifiers = getNumericModifierContributors(effects, "melee-attack");
  const rangedModifiers = getNumericModifierContributors(effects, "ranged-attack");

  const profiles: AttackProfile[] = [];

  for (const { source } of input.sources) {
    if (source.kind !== "equipment") continue;
    const entityId = source.entityId;
    if (!entityId) continue;

    const weapon = WEAPON_REGISTRY.get(entityId);
    if (!weapon) continue;

    const ability = resolveAttackAbility(weapon, input.base.abilityScores);
    const abilityMod = getAbilityModifier(input.base.abilityScores[ability]);
    const proficient = isProficientWithWeapon(weapon, proficiencies);
    const profBonus = proficient ? proficiencyBonus : 0;

    const attackModifiers = weapon.attackType === "melee" ? meleeModifiers : rangedModifiers;
    const extraAttackBonus = attackModifiers.reduce((sum, c) => sum + c.value, 0);
    const attackBonus = abilityMod + profBonus + extraAttackBonus;

    const attackExplanation = createExplanation(
      ability.charAt(0).toUpperCase() + ability.slice(1),
      abilityMod,
      [
        ...(proficient
          ? [{ sourceName: "Proficiency", value: profBonus, condition: undefined }]
          : []),
        ...attackModifiers,
      ],
    );

    const damageBonus = abilityMod;

    let masteryProperty: string | undefined;
    if (hasWeaponMasteryFeature) {
      const choice = weaponMasteryChoices.find((c) => c.weaponEntityId === entityId);
      if (choice) {
        masteryProperty = choice.masteryProperty;
      }
    }

    const profile: AttackProfile = {
      name: weapon.name,
      weaponEntityId: entityId,
      attackType: weapon.attackType,
      ability,
      attackBonus,
      attackExplanation,
      damageDice: weapon.damageDice,
      damageBonus,
      damageType: weapon.damageType,
      range: weapon.range,
      properties: weapon.properties,
      masteryProperty,
      isProficient: proficient,
    };

    profiles.push(profile);

    // For thrown melee weapons, also generate a ranged attack profile
    if (weapon.attackType === "melee" && isThrown(weapon)) {
      const rangedAbility: AttackAbility = "strength";
      const rangedAbilityMod = getAbilityModifier(input.base.abilityScores[rangedAbility]);
      const rangedExtraMods = rangedModifiers.reduce((sum, c) => sum + c.value, 0);
      const rangedAttackBonus = rangedAbilityMod + profBonus + rangedExtraMods;

      const rangedExplanation = createExplanation(
        rangedAbility.charAt(0).toUpperCase() + rangedAbility.slice(1),
        rangedAbilityMod,
        [
          ...(proficient
            ? [{ sourceName: "Proficiency", value: profBonus, condition: undefined }]
            : []),
          ...rangedModifiers,
        ],
      );

      const thrownRange = weapon.properties
        .find((p) => p.startsWith("Thrown"))
        ?.match(/\(([^)]+)\)/)?.[1];

      profiles.push({
        name: `${weapon.name} (Thrown)`,
        weaponEntityId: entityId,
        attackType: "ranged",
        ability: rangedAbility,
        attackBonus: rangedAttackBonus,
        attackExplanation: rangedExplanation,
        damageDice: weapon.damageDice,
        damageBonus: rangedAbilityMod,
        damageType: weapon.damageType,
        range: thrownRange ?? weapon.range,
        properties: weapon.properties,
        masteryProperty,
        isProficient: proficient,
      });
    }
  }

  return profiles;
}

/**
 * Extract weapon mastery choices from the character's source payload.
 * Looks for sources with payload.weaponMasteries array.
 */
function extractWeaponMasteryChoices(input: CharacterComputationInput): WeaponMasteryChoice[] {
  const choices: WeaponMasteryChoice[] = [];
  for (const { source } of input.sources) {
    const payload = source.payload;
    if (!payload) continue;
    const masteries = payload["weaponMasteries"];
    if (!Array.isArray(masteries)) continue;
    for (const m of masteries) {
      if (
        typeof m === "object" &&
        m !== null &&
        "weaponEntityId" in m &&
        "masteryProperty" in m &&
        typeof m.weaponEntityId === "string" &&
        typeof m.masteryProperty === "string"
      ) {
        choices.push({
          weaponEntityId: m.weaponEntityId,
          masteryProperty: m.masteryProperty,
        });
      }
    }
  }
  return choices;
}

/**
 * Check if the character has the Weapon Mastery class feature.
 * Looks for a source with entityId matching "class-feature:weapon-mastery".
 */
function checkHasWeaponMasteryFeature(input: CharacterComputationInput): boolean {
  return input.sources.some(
    ({ source }) =>
      source.entityId === "class-feature:weapon-mastery",
  );
}
