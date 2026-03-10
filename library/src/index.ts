// Types
export type * from "./types/index.ts";
export type * from "./canon/index.ts";

// Parsers
export { parseSpells } from "./parsers/index.ts";
export { parseMarkdown, splitByHeading, nodeText, isPageNumberLine } from "./parsers/index.ts";

// Engine
export {
  ALL_CONDITION_NAMES,
  applyPactBladeCharismaSubstitution,
  buildBardicInspirationDieTrait,
  buildBardicInspirationPool,
  buildCasterClassFeatureEffects,
  buildFontOfMagicConversionTrait,
  buildFontOfMagicPool,
  buildMagicalCunningTrait,
  buildMetamagicTraits,
  computeBardicInspirationMaxUses,
  computeMagicalCunningRecovery,
  computeSorceryPointsMax,
  ENGINE_VERSION,
  FULL_CASTER_SLOT_TABLE,
  HALF_CASTER_SLOT_TABLE,
  PACT_MAGIC_TABLE,
  buildACBreakdown,
  buildAlertInitiativeModifier,
  buildAttackProfiles,
  buildFeatAndSpeciesDynamicEffects,
  buildMagicInitiateEffects,
  buildResourcePoolDefinitions,
  buildSavageAttackerTrait,
  buildSkillState,
  buildSkilledProficiencies,
  buildSpellSlotPoolDefinitions,
  canAttackTarget,
  canTakeActions,
  canTakeReactions,
  computeCharacterState,
  computeConditionEffects,
  computePreparedSpellCapacity,
  derivePactMagicSlots,
  deriveStandardSlots,
  evaluatePrerequisites,
  extractMetamagicChoices,
  extractPactBladeBond,
  getAbilityModifier,
  getActiveConditionTags,
  getBardicInspirationDie,
  getBardicInspirationResetType,
  getClassLevel,
  getCantripCount,
  getCasterType,
  getKnownSpellCount,
  getMetamagicCost,
  getPoolsForRestType,
  getSpellLearningMode,
  getWeaponData,
  hasMagicalCunning,
  hasPactOfTheBlade,
  METAMAGIC_OPTIONS,
  hasDrowDancingLights,
  hasDrowFaerieFireFreeCast,
  hasDrowFeyAncestry,
  hasMusicianFeat,
  hasStoneEndurance,
  hasWoodElfDruidcraft,
  hasWoodElfSpeedBonus,
  hasWoodElfTrance,
  SKILL_ABILITY_MAP,
  SORCERY_POINT_SLOT_COST,
  stonesEnduranceReduction,
} from "./engine/index.ts";

export type { CasterType, SpellLearningMode } from "./engine/spellcasting.ts";

// Catalog helpers
export {
  getCanonicalEntity,
  getCanonicalEntityEffects,
  getCanonicalEffectsForSource,
  getCanonicalMechanicalEntity,
  getCanonicalSpellByName,
  listCanonicalEntitiesForEnabledPacks,
  listPackVisibleSpells,
  normalizeCanonicalEntityId,
} from "./catalog.ts";

// Canonical content
export {
  generatedContentManifest,
  allCanonAaAbilities,
  allCanonClasses,
  allCanonClassFeatures,
  allCanonConditions,
  allCanonEquipment,
  allCanonEntities,
  allCanonFeats,
  allCanonRules,
  allCanonSpecies,
  allCanonSpells,
  allRuntimeSpells,
} from "./generated/index.ts";
export {
  buildCanonicalManifest,
  canonicalSpellToRuntimeSpell,
  compileCanonicalEntities,
  validateCanonicalEntity,
} from "./canon/index.ts";
