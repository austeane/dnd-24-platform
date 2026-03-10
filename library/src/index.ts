// Types
export type * from "./types/index.ts";
export type * from "./canon/index.ts";

// Parsers
export { parseSpells } from "./parsers/index.ts";
export { parseMarkdown, splitByHeading, nodeText, isPageNumberLine } from "./parsers/index.ts";

// Engine
export {
  ALL_CONDITION_NAMES,
  ENGINE_VERSION,
  FULL_CASTER_SLOT_TABLE,
  HALF_CASTER_SLOT_TABLE,
  PACT_MAGIC_TABLE,
  buildACBreakdown,
  buildAttackProfiles,
  buildResourcePoolDefinitions,
  buildSkillState,
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
  getAbilityModifier,
  getActiveConditionTags,
  getCantripCount,
  getCasterType,
  getKnownSpellCount,
  getPoolsForRestType,
  getSpellLearningMode,
  getWeaponData,
  SKILL_ABILITY_MAP,
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
