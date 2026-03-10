/**
 * Choice-state persistence orchestration service.
 *
 * This file is owned by the `choice-state-and-equipment-persistence` batch.
 * The existing choice-state.ts contains the base CRUD operations;
 * this file holds higher-level orchestration for choice persistence
 * workflows (e.g. bulk choice recording, validation-and-record combos).
 */

import {
  listCharacterSkillChoices,
  recordSkillChoice,
  recordFeatChoice,
  recordEquipment,
  recordWeaponMastery,
  recordMetamagicChoice,
  recordPactBladeBond,
  getActivePactBladeBond,
  unbondPactBlade,
  listCharacterMetamagicChoices,
} from "./choice-state.ts";
import { listCharacterSources } from "./character-sources.ts";
import type {
  CharacterSkillChoiceRecord,
  CharacterFeatChoiceRecord,
  CharacterEquipmentRecord,
  CharacterWeaponMasteryRecord,
  CharacterMetamagicChoiceRecord,
  CharacterPactBladeBondRecord,
  RecordSkillChoiceInput,
  RecordFeatChoiceInput,
  RecordEquipmentInput,
  RecordWeaponMasteryInput,
  RecordMetamagicChoiceInput,
  RecordPactBladeBondInput,
} from "./types.ts";

/**
 * Validate a skill choice against existing proficiencies.
 * Checks for duplicates in the character's current skill choices.
 */
export async function validateSkillChoice(
  input: RecordSkillChoiceInput,
): Promise<{ valid: boolean; reason?: string }> {
  const existing = await listCharacterSkillChoices(input.characterId);
  const duplicate = existing.find(
    (record) => record.skillName === input.skillName,
  );

  if (duplicate) {
    return {
      valid: false,
      reason: `Character already has ${input.skillName} proficiency from ${duplicate.sourceLabel}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a feat choice.
 * Checks that the feat is not already recorded for this character.
 */
export async function validateFeatChoice(
  input: RecordFeatChoiceInput,
): Promise<{ valid: boolean; reason?: string }> {
  const sources = await listCharacterSources(input.characterId);
  const hasFeatSource = sources.some(
    (source) =>
      source.sourceKind === "feat" &&
      source.sourceEntityId === input.featEntityId,
  );

  if (!hasFeatSource) {
    return {
      valid: false,
      reason: `Character does not have a source for feat ${input.featLabel}`,
    };
  }

  return { valid: true };
}

/**
 * Bulk-record equipment from a starting equipment package or purchase.
 * Records all items in sequence, returning the full set of created records.
 */
export async function recordEquipmentBulk(
  characterId: string,
  items: RecordEquipmentInput[],
): Promise<CharacterEquipmentRecord[]> {
  const results: CharacterEquipmentRecord[] = [];

  for (const item of items) {
    const record = await recordEquipment({
      ...item,
      characterId,
    });
    results.push(record);
  }

  return results;
}

/**
 * Validate and record a weapon mastery choice.
 * Checks that the character has the Weapon Mastery class feature source.
 */
export async function validateAndRecordWeaponMastery(
  input: RecordWeaponMasteryInput,
): Promise<CharacterWeaponMasteryRecord> {
  const sources = await listCharacterSources(input.characterId);
  const hasWeaponMastery = sources.some(
    (source) =>
      source.sourceEntityId === "class-feature:weapon-mastery",
  );

  if (!hasWeaponMastery) {
    throw new Error(
      `Character does not have the Weapon Mastery feature`,
    );
  }

  return recordWeaponMastery(input);
}

/**
 * Validate and record a metamagic option choice.
 * Checks that the character has the Metamagic class feature source
 * and has not exceeded their option limit (2 at level 2, scaling up).
 */
export async function validateAndRecordMetamagicChoice(
  input: RecordMetamagicChoiceInput,
): Promise<CharacterMetamagicChoiceRecord> {
  const sources = await listCharacterSources(input.characterId);
  const hasMetamagic = sources.some(
    (source) =>
      source.sourceEntityId === "class-feature:metamagic",
  );

  if (!hasMetamagic) {
    throw new Error(
      `Character does not have the Metamagic feature`,
    );
  }

  const existing = await listCharacterMetamagicChoices(input.characterId);
  const duplicate = existing.find(
    (record) => record.metamagicOption === input.metamagicOption,
  );

  if (duplicate) {
    // Upsert behavior — update the existing record via the CRUD layer
    return recordMetamagicChoice(input);
  }

  return recordMetamagicChoice(input);
}

/**
 * Validate and record a pact blade bond.
 * Checks that the character has the Pact of the Blade feature source.
 * If an active bond exists, it is unbonded first.
 */
export async function validateAndRecordPactBladeBond(
  input: RecordPactBladeBondInput,
): Promise<CharacterPactBladeBondRecord> {
  const sources = await listCharacterSources(input.characterId);
  const hasPactBlade = sources.some(
    (source) =>
      source.sourceEntityId === "class-feature:pact-of-the-blade",
  );

  if (!hasPactBlade) {
    throw new Error(
      `Character does not have the Pact of the Blade feature`,
    );
  }

  // Unbond any existing active bond before creating a new one
  const activeBond = await getActivePactBladeBond(input.characterId);
  if (activeBond) {
    await unbondPactBlade(activeBond.id);
  }

  return recordPactBladeBond(input);
}

/**
 * Record all choices from a committed spend plan in a single pass.
 * Delegates to individual record functions for each choice type.
 */
export async function commitSpendPlanChoices(
  _planId: string,
  characterId: string,
  choices: {
    skills?: RecordSkillChoiceInput[];
    feats?: RecordFeatChoiceInput[];
    equipment?: RecordEquipmentInput[];
    weaponMasteries?: RecordWeaponMasteryInput[];
    metamagic?: RecordMetamagicChoiceInput[];
    pactBladeBonds?: RecordPactBladeBondInput[];
  } = {},
): Promise<{
  skills: CharacterSkillChoiceRecord[];
  feats: CharacterFeatChoiceRecord[];
  equipment: CharacterEquipmentRecord[];
  weaponMasteries: CharacterWeaponMasteryRecord[];
  metamagic: CharacterMetamagicChoiceRecord[];
  pactBladeBonds: CharacterPactBladeBondRecord[];
}> {
  const skills: CharacterSkillChoiceRecord[] = [];
  const feats: CharacterFeatChoiceRecord[] = [];
  const equipment: CharacterEquipmentRecord[] = [];
  const weaponMasteries: CharacterWeaponMasteryRecord[] = [];
  const metamagic: CharacterMetamagicChoiceRecord[] = [];
  const pactBladeBonds: CharacterPactBladeBondRecord[] = [];

  for (const input of choices.skills ?? []) {
    skills.push(await recordSkillChoice({ ...input, characterId }));
  }

  for (const input of choices.feats ?? []) {
    feats.push(await recordFeatChoice({ ...input, characterId }));
  }

  for (const input of choices.equipment ?? []) {
    equipment.push(await recordEquipment({ ...input, characterId }));
  }

  for (const input of choices.weaponMasteries ?? []) {
    weaponMasteries.push(await recordWeaponMastery({ ...input, characterId }));
  }

  for (const input of choices.metamagic ?? []) {
    metamagic.push(await recordMetamagicChoice({ ...input, characterId }));
  }

  for (const input of choices.pactBladeBonds ?? []) {
    pactBladeBonds.push(await recordPactBladeBond({ ...input, characterId }));
  }

  return { skills, feats, equipment, weaponMasteries, metamagic, pactBladeBonds };
}
