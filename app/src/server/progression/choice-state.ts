import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterEquipment,
  characterFeatChoices,
  characterMetamagicChoices,
  characterPactBladeBonds,
  characterSkillChoices,
  characterWeaponMasteries,
} from "../db/schema/index.ts";
import type {
  CharacterEquipmentRecord,
  CharacterFeatChoiceRecord,
  CharacterMetamagicChoiceRecord,
  CharacterPactBladeBondRecord,
  CharacterSkillChoiceRecord,
  CharacterWeaponMasteryRecord,
  RecordEquipmentInput,
  RecordFeatChoiceInput,
  RecordMetamagicChoiceInput,
  RecordPactBladeBondInput,
  RecordSkillChoiceInput,
  RecordWeaponMasteryInput,
  UpdateEquipmentInput,
} from "./types.ts";

// --- Skill Choices ---

export async function recordSkillChoice(
  input: RecordSkillChoiceInput,
): Promise<CharacterSkillChoiceRecord> {
  const [row] = await db
    .insert(characterSkillChoices)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      skillName: input.skillName,
      source: input.source,
      sourceLabel: input.sourceLabel.trim(),
      hasExpertise: input.hasExpertise ?? false,
    })
    .onConflictDoUpdate({
      target: [
        characterSkillChoices.characterId,
        characterSkillChoices.skillName,
      ],
      set: {
        source: input.source,
        sourceLabel: input.sourceLabel.trim(),
        hasExpertise: input.hasExpertise ?? false,
      },
    })
    .returning();

  return row!;
}

export async function listCharacterSkillChoices(
  characterId: string,
): Promise<CharacterSkillChoiceRecord[]> {
  return db
    .select()
    .from(characterSkillChoices)
    .where(eq(characterSkillChoices.characterId, characterId))
    .orderBy(asc(characterSkillChoices.skillName));
}

export async function deleteSkillChoice(
  characterId: string,
  skillName: string,
): Promise<boolean> {
  const result = await db
    .delete(characterSkillChoices)
    .where(
      and(
        eq(characterSkillChoices.characterId, characterId),
        eq(characterSkillChoices.skillName, skillName),
      ),
    )
    .returning({ id: characterSkillChoices.id });

  return result.length > 0;
}

// --- Feat Choices ---

export async function recordFeatChoice(
  input: RecordFeatChoiceInput,
): Promise<CharacterFeatChoiceRecord> {
  const [row] = await db
    .insert(characterFeatChoices)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      featEntityId: input.featEntityId,
      featPackId: input.featPackId ?? null,
      featLabel: input.featLabel.trim(),
      subChoicesJson: input.subChoicesJson ?? null,
      sourceLabel: input.sourceLabel.trim(),
    })
    .onConflictDoUpdate({
      target: [
        characterFeatChoices.characterId,
        characterFeatChoices.featEntityId,
      ],
      set: {
        featPackId: input.featPackId ?? null,
        featLabel: input.featLabel.trim(),
        subChoicesJson: input.subChoicesJson ?? null,
        sourceLabel: input.sourceLabel.trim(),
      },
    })
    .returning();

  return row!;
}

export async function listCharacterFeatChoices(
  characterId: string,
): Promise<CharacterFeatChoiceRecord[]> {
  return db
    .select()
    .from(characterFeatChoices)
    .where(eq(characterFeatChoices.characterId, characterId))
    .orderBy(asc(characterFeatChoices.featLabel));
}

// --- Equipment ---

export async function recordEquipment(
  input: RecordEquipmentInput,
): Promise<CharacterEquipmentRecord> {
  const [row] = await db
    .insert(characterEquipment)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      itemEntityId: input.itemEntityId,
      itemPackId: input.itemPackId ?? null,
      itemLabel: input.itemLabel.trim(),
      quantity: input.quantity ?? 1,
      equipped: input.equipped ?? false,
      slot: input.slot ?? null,
      stateJson: input.stateJson ?? null,
    })
    .onConflictDoUpdate({
      target: characterEquipment.id,
      set: {
        itemEntityId: input.itemEntityId,
        itemPackId: input.itemPackId ?? null,
        itemLabel: input.itemLabel.trim(),
        quantity: input.quantity ?? 1,
        equipped: input.equipped ?? false,
        slot: input.slot ?? null,
        stateJson: input.stateJson ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row!;
}

export async function updateEquipment(
  input: UpdateEquipmentInput,
): Promise<CharacterEquipmentRecord | null> {
  const updates: Partial<typeof characterEquipment.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.equipped !== undefined) {
    updates.equipped = input.equipped;
  }
  if (input.slot !== undefined) {
    updates.slot = input.slot;
  }
  if (input.quantity !== undefined) {
    updates.quantity = input.quantity;
  }
  if (input.stateJson !== undefined) {
    updates.stateJson = input.stateJson;
  }

  const [row] = await db
    .update(characterEquipment)
    .set(updates)
    .where(eq(characterEquipment.id, input.id))
    .returning();

  return row ?? null;
}

export async function listCharacterEquipment(
  characterId: string,
): Promise<CharacterEquipmentRecord[]> {
  return db
    .select()
    .from(characterEquipment)
    .where(eq(characterEquipment.characterId, characterId))
    .orderBy(asc(characterEquipment.itemLabel));
}

export async function deleteEquipment(equipmentId: string): Promise<boolean> {
  const result = await db
    .delete(characterEquipment)
    .where(eq(characterEquipment.id, equipmentId))
    .returning({ id: characterEquipment.id });

  return result.length > 0;
}

// --- Weapon Masteries ---

export async function recordWeaponMastery(
  input: RecordWeaponMasteryInput,
): Promise<CharacterWeaponMasteryRecord> {
  const [row] = await db
    .insert(characterWeaponMasteries)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      weaponEntityId: input.weaponEntityId,
      weaponPackId: input.weaponPackId ?? null,
      weaponLabel: input.weaponLabel.trim(),
      masteryProperty: input.masteryProperty,
    })
    .onConflictDoUpdate({
      target: [
        characterWeaponMasteries.characterId,
        characterWeaponMasteries.weaponEntityId,
      ],
      set: {
        weaponPackId: input.weaponPackId ?? null,
        weaponLabel: input.weaponLabel.trim(),
        masteryProperty: input.masteryProperty,
      },
    })
    .returning();

  return row!;
}

export async function listCharacterWeaponMasteries(
  characterId: string,
): Promise<CharacterWeaponMasteryRecord[]> {
  return db
    .select()
    .from(characterWeaponMasteries)
    .where(eq(characterWeaponMasteries.characterId, characterId))
    .orderBy(asc(characterWeaponMasteries.weaponLabel));
}

// --- Metamagic Choices ---

export async function recordMetamagicChoice(
  input: RecordMetamagicChoiceInput,
): Promise<CharacterMetamagicChoiceRecord> {
  const [row] = await db
    .insert(characterMetamagicChoices)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      metamagicOption: input.metamagicOption,
      sourceLabel: input.sourceLabel.trim(),
    })
    .onConflictDoUpdate({
      target: [
        characterMetamagicChoices.characterId,
        characterMetamagicChoices.metamagicOption,
      ],
      set: {
        sourceLabel: input.sourceLabel.trim(),
      },
    })
    .returning();

  return row!;
}

export async function listCharacterMetamagicChoices(
  characterId: string,
): Promise<CharacterMetamagicChoiceRecord[]> {
  return db
    .select()
    .from(characterMetamagicChoices)
    .where(eq(characterMetamagicChoices.characterId, characterId))
    .orderBy(asc(characterMetamagicChoices.metamagicOption));
}

// --- Pact Blade Bonds ---

export async function recordPactBladeBond(
  input: RecordPactBladeBondInput,
): Promise<CharacterPactBladeBondRecord> {
  const [row] = await db
    .insert(characterPactBladeBonds)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      weaponEntityId: input.weaponEntityId ?? null,
      weaponPackId: input.weaponPackId ?? null,
      weaponLabel: input.weaponLabel.trim(),
      isMagicWeapon: input.isMagicWeapon ?? false,
      bondedAt: input.bondedAt ?? new Date(),
    })
    .onConflictDoUpdate({
      target: characterPactBladeBonds.id,
      set: {
        weaponEntityId: input.weaponEntityId ?? null,
        weaponPackId: input.weaponPackId ?? null,
        weaponLabel: input.weaponLabel.trim(),
        isMagicWeapon: input.isMagicWeapon ?? false,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row!;
}

export async function getActivePactBladeBond(
  characterId: string,
): Promise<CharacterPactBladeBondRecord | null> {
  const [row] = await db
    .select()
    .from(characterPactBladeBonds)
    .where(
      and(
        eq(characterPactBladeBonds.characterId, characterId),
        isNull(characterPactBladeBonds.unbondedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function unbondPactBlade(
  bondId: string,
): Promise<CharacterPactBladeBondRecord | null> {
  const [row] = await db
    .update(characterPactBladeBonds)
    .set({
      unbondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(characterPactBladeBonds.id, bondId))
    .returning();

  return row ?? null;
}
