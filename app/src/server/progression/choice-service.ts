/**
 * Choice-state persistence operations service stub.
 *
 * This file is owned by the `choice-state-and-equipment-persistence` batch.
 * The existing choice-state.ts contains the base CRUD operations;
 * this file will hold higher-level orchestration for choice persistence
 * workflows (e.g. bulk choice recording during spend-plan commit).
 *
 * TODO: Implement bulk choice recording during spend-plan commit.
 * TODO: Implement choice validation against canonical feature definitions.
 * TODO: Implement choice rollback on spend-plan abandonment.
 */

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
 * Record all choices from a committed spend plan in a single transaction.
 * Validates choices against canonical feature definitions before persisting.
 *
 * TODO: Implement — extract choice operations from plan document,
 * validate each against canon, and persist in a transaction.
 */
export async function commitSpendPlanChoices(
  _planId: string,
  _characterId: string,
): Promise<{
  skills: CharacterSkillChoiceRecord[];
  feats: CharacterFeatChoiceRecord[];
  equipment: CharacterEquipmentRecord[];
  weaponMasteries: CharacterWeaponMasteryRecord[];
  metamagic: CharacterMetamagicChoiceRecord[];
  pactBladeBonds: CharacterPactBladeBondRecord[];
}> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: commitSpendPlanChoices");
}

/**
 * Validate a skill choice against canonical rules.
 * Checks class/background/feat skill lists and existing proficiencies.
 *
 * TODO: Implement — read canonical skill lists for the source,
 * check for duplicates, and return validation result.
 */
export async function validateSkillChoice(
  _input: RecordSkillChoiceInput,
): Promise<{ valid: boolean; reason?: string }> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: validateSkillChoice");
}

/**
 * Validate a feat choice against canonical rules.
 * Checks prerequisites, level requirements, and repeat restrictions.
 *
 * TODO: Implement — read canonical feat definition, check prerequisites
 * against character state, and return validation result.
 */
export async function validateFeatChoice(
  _input: RecordFeatChoiceInput,
): Promise<{ valid: boolean; reason?: string }> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: validateFeatChoice");
}

/**
 * Bulk-record equipment from a starting equipment package or purchase.
 *
 * TODO: Implement — validate items against canonical equipment definitions,
 * check carrying capacity if applicable, and persist all items.
 */
export async function recordEquipmentBulk(
  _characterId: string,
  _items: RecordEquipmentInput[],
): Promise<CharacterEquipmentRecord[]> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: recordEquipmentBulk");
}

/**
 * Validate and record a weapon mastery choice.
 * Checks that the character has the Weapon Mastery feature and
 * the weapon is mastery-eligible.
 *
 * TODO: Implement — read character sources for Weapon Mastery feature,
 * check weapon eligibility from canon, and delegate to recordWeaponMastery.
 */
export async function validateAndRecordWeaponMastery(
  _input: RecordWeaponMasteryInput,
): Promise<CharacterWeaponMasteryRecord> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: validateAndRecordWeaponMastery");
}

/**
 * Validate and record a metamagic option choice.
 * Checks that the character is a sorcerer with the Metamagic feature
 * and has not exceeded their option limit.
 *
 * TODO: Implement — read character sources for Metamagic feature,
 * count existing choices, validate against limit, and persist.
 */
export async function validateAndRecordMetamagicChoice(
  _input: RecordMetamagicChoiceInput,
): Promise<CharacterMetamagicChoiceRecord> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: validateAndRecordMetamagicChoice");
}

/**
 * Validate and record a pact blade bond.
 * Checks that the character has the Pact of the Blade feature.
 *
 * TODO: Implement — read character sources for Pact of the Blade,
 * check for existing active bond, and persist.
 */
export async function validateAndRecordPactBladeBond(
  _input: RecordPactBladeBondInput,
): Promise<CharacterPactBladeBondRecord> {
  // TODO: Implement in choice-state-and-equipment-persistence batch
  throw new Error("Not implemented: validateAndRecordPactBladeBond");
}
