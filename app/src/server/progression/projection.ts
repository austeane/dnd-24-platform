import {
  computeCharacterState,
  getCanonicalEffectsForSource,
  type ActiveCondition,
  type CharacterComputationInput,
  type Effect,
  type PersistedResourcePoolState,
  type SourceWithEffects,
  type XPLedgerEntry,
} from "@dnd/library";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterConditions,
  characterEquipment,
  characterFeatChoices,
  characterMetamagicChoices,
  characterPactBladeBonds,
  characterResourcePools,
  characterSkillChoices,
  characterSources,
  characterWeaponMasteries,
  xpTransactions,
} from "../db/schema/index.ts";
import { extractBaseSnapshot, mapCharacterSourcesToRuntime } from "./character-sources.ts";
import type {
  CharacterConditionRecord,
  CharacterEquipmentRecord,
  CharacterFeatChoiceRecord,
  CharacterMetamagicChoiceRecord,
  CharacterPactBladeBondRecord,
  CharacterResourcePoolRecord,
  CharacterRuntimeState,
  CharacterSkillChoiceRecord,
  CharacterSourceRecord,
  CharacterWeaponMasteryRecord,
  XpTransactionRecord,
} from "./types.ts";

export interface CharacterProjectionRows {
  sourceRecords: CharacterSourceRecord[];
  xpRecords: XpTransactionRecord[];
  activeConditionRecords: CharacterConditionRecord[];
  resourcePoolRecords: CharacterResourcePoolRecord[];
  skillChoiceRecords: CharacterSkillChoiceRecord[];
  featChoiceRecords: CharacterFeatChoiceRecord[];
  equipmentRecords: CharacterEquipmentRecord[];
  weaponMasteryRecords: CharacterWeaponMasteryRecord[];
  metamagicChoiceRecords: CharacterMetamagicChoiceRecord[];
  activePactBladeBond: CharacterPactBladeBondRecord | null;
}

function ensurePayload(source: SourceWithEffects["source"]): Record<string, unknown> {
  const existing = source.payload ?? {};
  source.payload = { ...existing };
  return source.payload;
}

function buildSkillChoiceEffects(
  skillChoiceRecords: CharacterSkillChoiceRecord[],
): Effect[] {
  return skillChoiceRecords.flatMap((skillChoice) => {
    const effects: Effect[] = [
      {
        type: "proficiency",
        category: "skill",
        value: skillChoice.skillName,
      },
    ];

    if (skillChoice.hasExpertise) {
      effects.push({
        type: "expertise",
        skill: skillChoice.skillName,
      });
    }

    return effects;
  });
}

function mergeFeatChoicePayloads(
  runtimeSources: SourceWithEffects[],
  featChoiceRecords: CharacterFeatChoiceRecord[],
): void {
  for (const featChoice of featChoiceRecords) {
    const matchingSource = runtimeSources.find(
      ({ source }) =>
        source.kind === "feat" &&
        source.entityId === featChoice.featEntityId,
    );

    if (!matchingSource) {
      continue;
    }

    const payload = ensurePayload(matchingSource.source);
    if (featChoice.subChoicesJson) {
      payload.subChoicesJson = featChoice.subChoicesJson;
    }
  }
}

function appendChoiceStateSources(
  characterId: string,
  runtimeSources: SourceWithEffects[],
  rows: CharacterProjectionRows,
): void {
  mergeFeatChoicePayloads(runtimeSources, rows.featChoiceRecords);

  if (rows.metamagicChoiceRecords.length > 0) {
    runtimeSources.push({
      source: {
        id: `projection:${characterId}:metamagic-choices`,
        kind: "override",
        name: "Metamagic Choices",
        payload: {
          metamagicChoices: rows.metamagicChoiceRecords.map((record) => record.metamagicOption),
        },
      },
      effects: [],
    });
  }

  if (rows.weaponMasteryRecords.length > 0) {
    runtimeSources.push({
      source: {
        id: `projection:${characterId}:weapon-masteries`,
        kind: "override",
        name: "Weapon Mastery Choices",
        payload: {
          weaponMasteries: rows.weaponMasteryRecords.map((record) => ({
            weaponEntityId: record.weaponEntityId,
            masteryProperty: record.masteryProperty,
          })),
        },
      },
      effects: [],
    });
  }

  if (rows.skillChoiceRecords.length > 0) {
    runtimeSources.push({
      source: {
        id: `projection:${characterId}:skill-choices`,
        kind: "override",
        name: "Skill Proficiencies",
      },
      effects: buildSkillChoiceEffects(rows.skillChoiceRecords),
    });
  }

  if (rows.activePactBladeBond) {
    const matchingSource = runtimeSources.find(
      ({ source }) => source.entityId === "class-feature:pact-of-the-blade",
    );

    if (matchingSource) {
      const payload = ensurePayload(matchingSource.source);
      payload.pactBladeBond = {
        weaponLabel: rows.activePactBladeBond.weaponLabel,
        weaponEntityId: rows.activePactBladeBond.weaponEntityId ?? undefined,
        isMagicWeapon: rows.activePactBladeBond.isMagicWeapon,
      };
    }
  }

  for (const equipment of rows.equipmentRecords) {
    if (!equipment.equipped) continue;

    runtimeSources.push({
      source: {
        id: `projection:${characterId}:equipment:${equipment.id}`,
        kind: "equipment",
        name: equipment.itemLabel,
        entityId: equipment.itemEntityId,
        packId: equipment.itemPackId ?? undefined,
        payload: equipment.stateJson ?? undefined,
      },
      effects: getCanonicalEffectsForSource(
        equipment.itemPackId ?? undefined,
        equipment.itemEntityId,
      ),
    });
  }
}

function mapXpLedger(records: XpTransactionRecord[]): XPLedgerEntry[] {
  return records.map((record) => ({
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    amount: record.amount,
    category: record.category,
    note: record.note,
    sessionId: record.sessionId ?? undefined,
  }));
}

function mapActiveConditions(
  records: CharacterConditionRecord[],
): ActiveCondition[] {
  return records.map((record) => ({
    conditionName: record.conditionName,
    appliedAt: record.appliedAt.toISOString(),
    appliedByLabel: record.appliedByLabel,
    sourceCreature: record.sourceCreature ?? undefined,
    note: record.note ?? undefined,
  }));
}

function mapResourcePoolState(
  records: CharacterResourcePoolRecord[],
): PersistedResourcePoolState[] {
  return records.map((record) => ({
    resourceName: record.resourceName,
    currentUses: record.currentUses,
    maxUses: record.maxUses,
    resetOn: record.resetOn,
    sourceName: record.sourceName,
  }));
}

export async function loadCharacterProjectionRows(
  characterId: string,
): Promise<CharacterProjectionRows> {
  const [
    sourceRecords,
    xpRecords,
    activeConditionRecords,
    resourcePoolRecords,
    skillChoiceRecords,
    featChoiceRecords,
    equipmentRecords,
    weaponMasteryRecords,
    metamagicChoiceRecords,
    activePactBladeBondRows,
  ] = await Promise.all([
    db
      .select()
      .from(characterSources)
      .where(eq(characterSources.characterId, characterId))
      .orderBy(asc(characterSources.sourceKind), asc(characterSources.rank)),
    db
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.characterId, characterId))
      .orderBy(asc(xpTransactions.createdAt), asc(xpTransactions.id)),
    db
      .select()
      .from(characterConditions)
      .where(
        and(
          eq(characterConditions.characterId, characterId),
          isNull(characterConditions.removedAt),
        ),
      )
      .orderBy(asc(characterConditions.appliedAt), asc(characterConditions.id)),
    db
      .select()
      .from(characterResourcePools)
      .where(eq(characterResourcePools.characterId, characterId))
      .orderBy(asc(characterResourcePools.resourceName)),
    db
      .select()
      .from(characterSkillChoices)
      .where(eq(characterSkillChoices.characterId, characterId))
      .orderBy(asc(characterSkillChoices.skillName)),
    db
      .select()
      .from(characterFeatChoices)
      .where(eq(characterFeatChoices.characterId, characterId))
      .orderBy(asc(characterFeatChoices.featLabel)),
    db
      .select()
      .from(characterEquipment)
      .where(eq(characterEquipment.characterId, characterId))
      .orderBy(asc(characterEquipment.itemLabel), asc(characterEquipment.id)),
    db
      .select()
      .from(characterWeaponMasteries)
      .where(eq(characterWeaponMasteries.characterId, characterId))
      .orderBy(asc(characterWeaponMasteries.weaponLabel)),
    db
      .select()
      .from(characterMetamagicChoices)
      .where(eq(characterMetamagicChoices.characterId, characterId))
      .orderBy(asc(characterMetamagicChoices.metamagicOption)),
    db
      .select()
      .from(characterPactBladeBonds)
      .where(
        and(
          eq(characterPactBladeBonds.characterId, characterId),
          isNull(characterPactBladeBonds.unbondedAt),
        ),
      )
      .limit(1),
  ]);

  return {
    sourceRecords,
    xpRecords,
    activeConditionRecords,
    resourcePoolRecords,
    skillChoiceRecords,
    featChoiceRecords,
    equipmentRecords,
    weaponMasteryRecords,
    metamagicChoiceRecords,
    activePactBladeBond: activePactBladeBondRows[0] ?? null,
  };
}

export function buildCharacterComputationInput(
  characterId: string,
  rows: CharacterProjectionRows,
): CharacterComputationInput | null {
  const baseSnapshot = extractBaseSnapshot(rows.sourceRecords);
  if (!baseSnapshot) {
    return null;
  }

  const runtimeSources = mapCharacterSourcesToRuntime(rows.sourceRecords);
  appendChoiceStateSources(characterId, runtimeSources, rows);

  return {
    base: baseSnapshot,
    sources: runtimeSources,
    xpLedger: mapXpLedger(rows.xpRecords),
    activeConditions: mapActiveConditions(rows.activeConditionRecords),
    resourcePoolState: mapResourcePoolState(rows.resourcePoolRecords),
  };
}

export function buildCharacterRuntimeStateFromRows(
  characterId: string,
  rows: CharacterProjectionRows,
): CharacterRuntimeState | null {
  const input = buildCharacterComputationInput(characterId, rows);
  if (!input) {
    return null;
  }

  return computeCharacterState(input);
}
