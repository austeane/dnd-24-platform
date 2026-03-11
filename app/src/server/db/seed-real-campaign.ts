import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCanonicalEffectsForSource,
  getCanonicalSpellByName,
  normalizeCanonicalEntityId,
  type PackId,
} from "@dnd/library";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  createCampaign,
  createCharacter,
  getCampaignBySlug,
  listCampaignRoster,
  updateCampaignSettings,
  updateCharacterIdentity,
} from "../campaigns/index.ts";
import { client, db } from "./index.ts";
import {
  characterEquipment,
  characterFeatChoices,
  characterMetamagicChoices,
  characterPactBladeBonds,
  characterSkillChoices,
  characterSourceKinds,
  characterSources,
  characterWeaponMasteries,
  equipmentSlots,
  levelingMethods,
  progressionModes,
  skillChoiceSources,
  xpTransactionCategories,
  xpTransactions,
} from "./schema/index.ts";
import {
  getCharacterRuntimeState,
  listCharacterSources,
  syncCharacterHitPoints,
  syncCharacterDerivedState,
} from "../progression/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const defaultSeedPath = path.join(
  rootDir,
  "data",
  "real-campaign-intake",
  "verified-characters.json",
);

const reviewStatuses = ["reviewed", "verified", "needs-review"] as const;
const abilityNames = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

const featureSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sourceKind: z.enum(characterSourceKinds),
  sourceEntityId: z.string().min(1),
  sourcePackId: z.string().min(1).nullable().optional(),
  rank: z.number().int().positive().optional(),
  description: z.string().min(1).optional(),
  effects: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: z.array(z.string()).default([]),
});

const xpEntrySchema = z.object({
  id: z.string().min(1),
  amount: z.number().int(),
  category: z.enum(xpTransactionCategories),
  note: z.string().min(1),
  createdByLabel: z.string().min(1).default("seed-real-campaign"),
  sessionId: z.string().min(1).nullable().optional(),
});

const skillChoiceSchema = z.object({
  skillName: z.string().min(1),
  source: z.enum(skillChoiceSources),
  sourceLabel: z.string().min(1),
  hasExpertise: z.boolean().optional(),
});

const featChoiceSchema = z.object({
  featEntityId: z.string().min(1),
  featPackId: z.string().min(1).nullable().optional(),
  featLabel: z.string().min(1),
  subChoicesJson: z.record(z.string(), z.unknown()).nullable().optional(),
  sourceLabel: z.string().min(1),
});

const equipmentEntrySchema = z.object({
  itemEntityId: z.string().min(1),
  itemPackId: z.string().min(1).nullable().optional(),
  itemLabel: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  equipped: z.boolean().default(false),
  slot: z.enum(equipmentSlots).nullable().optional(),
  stateJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

const weaponMasterySchema = z.object({
  weaponEntityId: z.string().min(1),
  weaponPackId: z.string().min(1).nullable().optional(),
  weaponLabel: z.string().min(1),
  masteryProperty: z.string().min(1),
});

const metamagicChoiceSchema = z.object({
  metamagicOption: z.string().min(1),
  sourceLabel: z.string().min(1),
});

const pactBladeBondSchema = z.object({
  weaponEntityId: z.string().min(1).nullable().optional(),
  weaponPackId: z.string().min(1).nullable().optional(),
  weaponLabel: z.string().min(1),
  isMagicWeapon: z.boolean().default(false),
});

const verifiedCharacterSchema = z.object({
  reviewStatus: z.enum(reviewStatuses),
  sourceFiles: z.array(z.string().min(1)).min(1),
  identity: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    className: z.string().min(1),
    classId: z.string().min(1),
    level: z.number().int().positive(),
  }),
  tableState: z.object({
    armorClass: z.number().int().nonnegative(),
    maxHp: z.number().int().nonnegative(),
    speed: z.number().int().nonnegative(),
    passivePerception: z.number().int().nonnegative().optional(),
  }),
  abilities: z.object({
    strength: z.number().int(),
    dexterity: z.number().int(),
    constitution: z.number().int(),
    intelligence: z.number().int(),
    wisdom: z.number().int(),
    charisma: z.number().int(),
  }),
  spellcasting: z.object({
    ability: z.enum(abilityNames),
    spellSaveDc: z.number().int().nonnegative().optional(),
    spellAttackBonus: z.number().int().optional(),
    knownSpells: z.array(z.string().min(1)).default([]),
  }).nullable(),
  sourceLedger: z.object({
    features: z.array(featureSchema).default([]),
  }).default({ features: [] }),
  skillChoices: z.array(skillChoiceSchema).default([]),
  featChoices: z.array(featChoiceSchema).default([]),
  equipment: z.array(equipmentEntrySchema).default([]),
  weaponMasteries: z.array(weaponMasterySchema).default([]),
  metamagicChoices: z.array(metamagicChoiceSchema).default([]),
  pactBladeBond: pactBladeBondSchema.nullable().optional(),
  xpLedger: z.array(xpEntrySchema).default([]),
  notes: z.array(z.string()).default([]),
});

const verifiedCampaignSchema = z.object({
  campaign: z.object({
    reviewStatus: z.enum(reviewStatuses),
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    progressionMode: z.enum(progressionModes).default("hybrid"),
    levelingMethod: z.enum(levelingMethods).default("fixed-cost"),
    enabledPackIds: z.array(z.string().min(1)).min(1),
  }),
  characters: z.array(verifiedCharacterSchema).min(1),
});

type VerifiedCampaignSeed = z.infer<typeof verifiedCampaignSchema>;
type VerifiedCharacterSeed = z.infer<typeof verifiedCharacterSchema>;
type SeedFeature = z.infer<typeof featureSchema>;

interface DefaultFeatureBlueprint {
  minimumLevel: number;
  feature: SeedFeature;
}

function createSeedId(characterSlug: string, suffix: string): string {
  return `seed:${characterSlug}:${suffix}`;
}

const defaultClassFeatureBlueprints: Record<string, DefaultFeatureBlueprint[]> = {
  fighter: [
    {
      minimumLevel: 1,
      feature: {
        id: "second-wind",
        label: "Second Wind",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:second-wind",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Bonus Action self-healing that refreshes on rests.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 1,
      feature: {
        id: "weapon-mastery",
        label: "Weapon Mastery",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:weapon-mastery",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Tracked as a known combat feature.",
        effects: [],
        notes: [],
      },
    },
  ],
  druid: [
    {
      minimumLevel: 2,
      feature: {
        id: "druidic-spellcasting-2",
        label: "Druidic Spellcasting (Level 2)",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:druidic-spellcasting-2",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Level-2 spell-slot progression for druid spellcasting.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 2,
      feature: {
        id: "wild-shape",
        label: "Wild Shape",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:wild-shape",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Core Wild Shape action and resource loop.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 2,
      feature: {
        id: "wild-companion",
        label: "Wild Companion",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:wild-companion",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Spend Wild Shape for companion utility.",
        effects: [],
        notes: [],
      },
    },
  ],
  warlock: [
    {
      minimumLevel: 2,
      feature: {
        id: "pact-magic-2",
        label: "Pact Magic (Level 2)",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:pact-magic-2",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Level-2 pact slot progression for warlock spellcasting.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 2,
      feature: {
        id: "magical-cunning",
        label: "Magical Cunning",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:magical-cunning",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Recover pact slots after a short ritual.",
        effects: [],
        notes: [],
      },
    },
  ],
  bard: [
    {
      minimumLevel: 2,
      feature: {
        id: "bard-spellcasting-2",
        label: "Bard Spellcasting (Level 2)",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:bard-spellcasting-2",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Level-2 spell-slot progression for bard spellcasting.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 1,
      feature: {
        id: "bardic-inspiration",
        label: "Bardic Inspiration",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:bardic-inspiration",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Action and resource loop for bardic support.",
        effects: [],
        notes: [],
      },
    },
  ],
  sorcerer: [
    {
      minimumLevel: 2,
      feature: {
        id: "sorcerous-spellcasting-2",
        label: "Sorcerous Spellcasting (Level 2)",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:sorcerous-spellcasting-2",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Level-2 spell-slot progression for sorcerer spellcasting.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 2,
      feature: {
        id: "font-of-magic",
        label: "Font of Magic",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:font-of-magic",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Sorcery point resource loop.",
        effects: [],
        notes: [],
      },
    },
    {
      minimumLevel: 2,
      feature: {
        id: "metamagic",
        label: "Metamagic",
        sourceKind: "class-feature",
        sourceEntityId: "class-feature:metamagic",
        sourcePackId: "srd-5e-2024",
        rank: 1,
        description: "Metamagic options modify how sorcerer spells behave.",
        effects: [],
        notes: [],
      },
    },
  ],
};

async function upsertCharacterSource(
  values: typeof characterSources.$inferInsert,
): Promise<void> {
  await db
    .insert(characterSources)
    .values(values)
    .onConflictDoUpdate({
      target: characterSources.id,
      set: {
        sourceKind: values.sourceKind,
        sourceEntityId: values.sourceEntityId,
        sourcePackId: values.sourcePackId ?? null,
        label: values.label,
        rank: values.rank ?? 1,
        payloadJson: values.payloadJson ?? null,
        suppressedAt: null,
        updatedAt: new Date(),
      },
    });
}

async function upsertXpTransaction(
  values: typeof xpTransactions.$inferInsert,
): Promise<void> {
  await db
    .insert(xpTransactions)
    .values(values)
    .onConflictDoUpdate({
      target: xpTransactions.id,
      set: {
        campaignId: values.campaignId,
        characterId: values.characterId,
        sessionId: values.sessionId ?? null,
        category: values.category,
        amount: values.amount,
        note: values.note,
        createdByLabel: values.createdByLabel,
      },
    });
}

async function cleanupStaleSeedRows(
  characterId: string,
  characterSlug: string,
  desiredSourceIds: Set<string>,
  desiredXpIds: Set<string>,
): Promise<void> {
  const existingSources = await listCharacterSources(characterId);
  const staleSourceIds = existingSources
    .filter((record) =>
      record.id.startsWith(`seed:${characterSlug}:`) && !desiredSourceIds.has(record.id)
    )
    .map((record) => record.id);

  if (staleSourceIds.length > 0) {
    await db.delete(characterSources).where(inArray(characterSources.id, staleSourceIds));
  }

  const existingXp = await db
    .select({ id: xpTransactions.id })
    .from(xpTransactions)
    .where(eq(xpTransactions.characterId, characterId));
  const staleXpIds = existingXp
    .map((record) => record.id)
    .filter((id) => id.startsWith(`seed:${characterSlug}:xp:`) && !desiredXpIds.has(id));

  if (staleXpIds.length > 0) {
    await db.delete(xpTransactions).where(inArray(xpTransactions.id, staleXpIds));
  }
}

function buildBaseSnapshot(
  progressionMode: (typeof progressionModes)[number],
  character: VerifiedCharacterSeed,
  seedFeatures: SeedFeature[],
) {
  const derivedWalkSpeedBonus = seedFeatures.reduce((sum, feature) => {
    const canonicalEffects = getCanonicalEffectsForSource(
      feature.sourcePackId ?? undefined,
      feature.sourceEntityId,
    );
    const combinedEffects = [...canonicalEffects, ...feature.effects];

    return sum + combinedEffects.reduce((innerSum, effect) => {
      if (effect.type !== "speed-bonus" || effect.movementType !== "walk") {
        return innerSum;
      }

      return innerSum + effect.value;
    }, 0);
  }, 0);

  return {
    name: character.identity.name,
    progressionMode,
    abilityScores: character.abilities,
    baseArmorClass: character.tableState.armorClass,
    baseMaxHP: character.tableState.maxHp,
    baseSpeed: Math.max(character.tableState.speed - derivedWalkSpeedBonus, 0),
    basePassivePerception: character.tableState.passivePerception,
    spellcastingAbility: character.spellcasting?.ability,
  };
}

function buildFeaturePayload(feature: SeedFeature): Record<string, unknown> {
  return {
    description: feature.description,
    notes: feature.notes,
    effects: feature.effects,
    seedTag: "real-campaign-intake",
  };
}

function getFeatureMergeKey(feature: SeedFeature): string {
  return [
    feature.sourceKind,
    normalizeCanonicalEntityId(feature.sourceEntityId) ?? feature.sourceEntityId,
    feature.rank ?? 1,
  ].join(":");
}

function buildSeedFeatureSet(character: VerifiedCharacterSeed): SeedFeature[] {
  const merged = new Map<string, SeedFeature>();

  for (const blueprint of defaultClassFeatureBlueprints[character.identity.classId] ?? []) {
    if (character.identity.level < blueprint.minimumLevel) {
      continue;
    }

    merged.set(getFeatureMergeKey(blueprint.feature), blueprint.feature);
  }

  for (const feature of character.sourceLedger.features) {
    merged.set(getFeatureMergeKey(feature), feature);
  }

  return [...merged.values()];
}

async function seedChoiceState(
  characterId: string,
  characterSlug: string,
  character: VerifiedCharacterSeed,
): Promise<void> {
  // --- Skill choices: delete-and-replace ---
  await db
    .delete(characterSkillChoices)
    .where(eq(characterSkillChoices.characterId, characterId));
  for (const skill of character.skillChoices) {
    const skillId = createSeedId(characterSlug, `skill:${skill.skillName.toLowerCase().replace(/\s+/g, "-")}`);
    await db
      .insert(characterSkillChoices)
      .values({
        id: skillId,
        characterId,
        skillName: skill.skillName,
        source: skill.source,
        sourceLabel: skill.sourceLabel,
        hasExpertise: skill.hasExpertise ?? false,
      })
      .onConflictDoUpdate({
        target: [characterSkillChoices.characterId, characterSkillChoices.skillName],
        set: {
          source: skill.source,
          sourceLabel: skill.sourceLabel,
          hasExpertise: skill.hasExpertise ?? false,
        },
      });
  }

  // --- Feat choices: delete-and-replace ---
  await db
    .delete(characterFeatChoices)
    .where(eq(characterFeatChoices.characterId, characterId));
  for (const feat of character.featChoices) {
    const featId = createSeedId(characterSlug, `feat:${feat.featEntityId}`);
    await db
      .insert(characterFeatChoices)
      .values({
        id: featId,
        characterId,
        featEntityId: feat.featEntityId,
        featPackId: feat.featPackId ?? null,
        featLabel: feat.featLabel,
        subChoicesJson: feat.subChoicesJson ?? null,
        sourceLabel: feat.sourceLabel,
      })
      .onConflictDoUpdate({
        target: [characterFeatChoices.characterId, characterFeatChoices.featEntityId],
        set: {
          featPackId: feat.featPackId ?? null,
          featLabel: feat.featLabel,
          subChoicesJson: feat.subChoicesJson ?? null,
          sourceLabel: feat.sourceLabel,
        },
      });
  }

  // --- Equipment: delete-and-replace ---
  await db
    .delete(characterEquipment)
    .where(eq(characterEquipment.characterId, characterId));
  for (let i = 0; i < character.equipment.length; i++) {
    const item = character.equipment[i];
    const itemId = createSeedId(characterSlug, `equip:${i}:${item.itemEntityId}`);
    await db
      .insert(characterEquipment)
      .values({
        id: itemId,
        characterId,
        itemEntityId: item.itemEntityId,
        itemPackId: item.itemPackId ?? null,
        itemLabel: item.itemLabel,
        quantity: item.quantity,
        equipped: item.equipped,
        slot: item.slot ?? null,
        stateJson: item.stateJson ?? null,
      });
  }

  // --- Weapon masteries: delete-and-replace ---
  await db
    .delete(characterWeaponMasteries)
    .where(eq(characterWeaponMasteries.characterId, characterId));
  for (const mastery of character.weaponMasteries) {
    const masteryId = createSeedId(characterSlug, `mastery:${mastery.weaponEntityId}`);
    await db
      .insert(characterWeaponMasteries)
      .values({
        id: masteryId,
        characterId,
        weaponEntityId: mastery.weaponEntityId,
        weaponPackId: mastery.weaponPackId ?? null,
        weaponLabel: mastery.weaponLabel,
        masteryProperty: mastery.masteryProperty,
      })
      .onConflictDoUpdate({
        target: [characterWeaponMasteries.characterId, characterWeaponMasteries.weaponEntityId],
        set: {
          weaponPackId: mastery.weaponPackId ?? null,
          weaponLabel: mastery.weaponLabel,
          masteryProperty: mastery.masteryProperty,
        },
      });
  }

  // --- Metamagic choices: delete-and-replace ---
  await db
    .delete(characterMetamagicChoices)
    .where(eq(characterMetamagicChoices.characterId, characterId));
  for (const meta of character.metamagicChoices) {
    const metaId = createSeedId(characterSlug, `metamagic:${meta.metamagicOption.toLowerCase().replace(/\s+/g, "-")}`);
    await db
      .insert(characterMetamagicChoices)
      .values({
        id: metaId,
        characterId,
        metamagicOption: meta.metamagicOption,
        sourceLabel: meta.sourceLabel,
      })
      .onConflictDoUpdate({
        target: [characterMetamagicChoices.characterId, characterMetamagicChoices.metamagicOption],
        set: {
          sourceLabel: meta.sourceLabel,
        },
      });
  }

  // --- Pact blade bond: delete-and-replace ---
  await db
    .delete(characterPactBladeBonds)
    .where(eq(characterPactBladeBonds.characterId, characterId));
  if (character.pactBladeBond) {
    const bondId = createSeedId(characterSlug, "pact-blade-bond");
    await db
      .insert(characterPactBladeBonds)
      .values({
        id: bondId,
        characterId,
        weaponEntityId: character.pactBladeBond.weaponEntityId ?? null,
        weaponPackId: character.pactBladeBond.weaponPackId ?? null,
        weaponLabel: character.pactBladeBond.weaponLabel,
        isMagicWeapon: character.pactBladeBond.isMagicWeapon,
      });
  }
}

async function seedCharacter(
  campaignId: string,
  campaignName: string,
  progressionMode: (typeof progressionModes)[number],
  enabledPackIds: PackId[],
  character: VerifiedCharacterSeed,
): Promise<void> {
  const roster = await listCampaignRoster(campaignId);
  const existing = roster.find((entry) => entry.slug === character.identity.slug);
  const record = existing
    ? await updateCharacterIdentity({
        characterId: existing.id,
        slug: character.identity.slug,
        name: character.identity.name,
      })
    : await createCharacter({
        campaignId,
        slug: character.identity.slug,
        name: character.identity.name,
      });

  if (!record) {
    throw new Error(`Could not create or update character ${character.identity.slug}`);
  }

  const desiredSourceIds = new Set<string>();
  const desiredXpIds = new Set<string>();
  const seedFeatures = buildSeedFeatureSet(character);

  const baseSourceId = createSeedId(character.identity.slug, "base");
  desiredSourceIds.add(baseSourceId);
  await upsertCharacterSource({
    id: baseSourceId,
    characterId: record.id,
    sourceKind: "override",
    sourceEntityId: "seed:base-snapshot",
    sourcePackId: null,
    label: "Verified sheet baseline",
      rank: 1,
      payloadJson: {
      baseSnapshot: buildBaseSnapshot(progressionMode, character, seedFeatures),
      sourceFiles: character.sourceFiles,
      reviewStatus: character.reviewStatus,
      notes: character.notes,
      seedTag: "real-campaign-intake",
    },
  });

  const classSourceId = createSeedId(
    character.identity.slug,
    `class:${character.identity.classId}`,
  );
  desiredSourceIds.add(classSourceId);
  await upsertCharacterSource({
    id: classSourceId,
    characterId: record.id,
    sourceKind: "class-level",
    sourceEntityId: `class:${character.identity.classId}`,
    sourcePackId: "srd-5e-2024",
    label: `${character.identity.className} ${character.identity.level}`,
    rank: 1,
    payloadJson: {
      description: `Seeded from verified sheet intake for ${campaignName}.`,
      levelsGranted: character.identity.level,
      seedTag: "real-campaign-intake",
    },
  });

  if (character.spellcasting && character.spellcasting.knownSpells.length > 0) {
    const spellSourceId = createSeedId(character.identity.slug, "feature:spell-list");
    desiredSourceIds.add(spellSourceId);
    await upsertCharacterSource({
      id: spellSourceId,
      characterId: record.id,
      sourceKind: "class-feature",
      sourceEntityId: "seed:spell-list",
      sourcePackId: null,
      label: `${character.identity.className} spell list`,
      rank: 1,
      payloadJson: {
        description: "Photo-reviewed spell list used for initial runtime projection.",
        effects: character.spellcasting.knownSpells.map((spellName) => {
          const spell = getCanonicalSpellByName(spellName, enabledPackIds);

          return {
            type: "grant-spell-access",
            spell: {
              spellName,
              spellEntityId: spell?.id,
              spellPackId: spell?.packId,
              alwaysPrepared: false,
              source: character.identity.className,
            },
          };
        }),
        sheetSpellSaveDc: character.spellcasting.spellSaveDc,
        sheetSpellAttackBonus: character.spellcasting.spellAttackBonus,
        seedTag: "real-campaign-intake",
      },
    });
  }

  for (const feature of seedFeatures) {
    const featureSourceId = createSeedId(character.identity.slug, `feature:${feature.id}`);
    desiredSourceIds.add(featureSourceId);
    await upsertCharacterSource({
      id: featureSourceId,
      characterId: record.id,
      sourceKind: feature.sourceKind,
      sourceEntityId: feature.sourceEntityId,
      sourcePackId: feature.sourcePackId ?? null,
      label: feature.label,
      rank: feature.rank ?? 1,
      payloadJson: buildFeaturePayload(feature),
    });
  }

  for (const entry of character.xpLedger) {
    const xpId = createSeedId(character.identity.slug, `xp:${entry.id}`);
    desiredXpIds.add(xpId);
    await upsertXpTransaction({
      id: xpId,
      campaignId,
      characterId: record.id,
      sessionId: entry.sessionId ?? null,
      category: entry.category,
      amount: entry.amount,
      note: entry.note,
      createdByLabel: entry.createdByLabel,
    });
  }

  await cleanupStaleSeedRows(record.id, character.identity.slug, desiredSourceIds, desiredXpIds);

  await seedChoiceState(record.id, character.identity.slug, character);
  await syncCharacterDerivedState(record.id);

  if (character.identity.slug === "tali") {
    const taliRuntimeState = await getCharacterRuntimeState(record.id);
    if (!taliRuntimeState) {
      throw new Error(`Could not compute runtime state for ${character.identity.slug}`);
    }

    await syncCharacterHitPoints({
      characterId: record.id,
      maxHP: taliRuntimeState.maxHP,
      currentHP: Math.max(taliRuntimeState.maxHP - 4, 1),
      tempHP: 2,
    });
  }

  const runtimeState = await getCharacterRuntimeState(record.id);
  if (!runtimeState) {
    throw new Error(`Could not compute runtime state for ${character.identity.slug}`);
  }

  process.stdout.write(
    `Seeded ${character.identity.name}: level ${runtimeState.level}, AC ${runtimeState.armorClass.total}, HP ${runtimeState.maxHP}, banked XP ${runtimeState.xp.banked}\n`,
  );
}

export async function seedVerifiedCampaign(
  parsed: VerifiedCampaignSeed,
): Promise<void> {
  const existingCampaign = await getCampaignBySlug(parsed.campaign.slug);
  const campaign = existingCampaign
    ? await updateCampaignSettings({
        campaignId: existingCampaign.id,
        name: parsed.campaign.name,
        progressionMode: parsed.campaign.progressionMode,
        levelingMethod: parsed.campaign.levelingMethod,
        enabledPackIds: parsed.campaign.enabledPackIds,
      })
    : await createCampaign({
        id: parsed.campaign.id,
        slug: parsed.campaign.slug,
        name: parsed.campaign.name,
        progressionMode: parsed.campaign.progressionMode,
        levelingMethod: parsed.campaign.levelingMethod,
        enabledPackIds: parsed.campaign.enabledPackIds,
      });

  if (!campaign) {
    throw new Error("Failed to create or update campaign");
  }

  for (const character of parsed.characters) {
    if (character.reviewStatus === "needs-review") {
      process.stdout.write(`Skipping ${character.identity.slug}: needs-review\n`);
      continue;
    }

    await seedCharacter(
      campaign.id,
      campaign.name,
      parsed.campaign.progressionMode,
      parsed.campaign.enabledPackIds as PackId[],
      character,
    );
  }
}

export async function seedVerifiedCampaignFromPath(
  inputPath = defaultSeedPath,
): Promise<void> {
  const rawInput = await readFile(inputPath, "utf8");
  const parsed = verifiedCampaignSchema.parse(JSON.parse(rawInput)) satisfies VerifiedCampaignSeed;
  await seedVerifiedCampaign(parsed);
}

async function main(): Promise<void> {
  const inputPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : defaultSeedPath;
  await seedVerifiedCampaignFromPath(inputPath);
}

const isMain = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    await main();
  } finally {
    await client.end({ timeout: 5 });
  }
}
