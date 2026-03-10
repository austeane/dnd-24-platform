export { computeCharacterState, getAbilityModifier } from "./character-computer.ts";
export { evaluatePrerequisites } from "./prerequisite-evaluator.ts";
export { buildSkillState, SKILL_ABILITY_MAP } from "./proficiencies.ts";
export {
  buildResourcePoolDefinitions,
  getPoolsForRestType,
} from "./traits-and-resources.ts";

export {
  ALL_CONDITION_NAMES,
  canAttackTarget,
  canTakeActions,
  canTakeReactions,
  computeConditionEffects,
  getActiveConditionTags,
} from "./conditions.ts";

export {
  buildSpellSlotPoolDefinitions,
  computePreparedSpellCapacity,
  derivePactMagicSlots,
  deriveStandardSlots,
  getCantripCount,
  getCasterType,
  getKnownSpellCount,
  getSpellLearningMode,
  FULL_CASTER_SLOT_TABLE,
  HALF_CASTER_SLOT_TABLE,
  PACT_MAGIC_TABLE,
} from "./spellcasting.ts";

export { buildACBreakdown } from "./defenses.ts";
export { buildAttackProfiles, getWeaponData } from "./attack-profiles.ts";

export {
  buildAlertInitiativeModifier,
  buildFeatAndSpeciesDynamicEffects,
  buildMagicInitiateEffects,
  buildSavageAttackerTrait,
  buildSkilledProficiencies,
  getBardicInspirationResetType,
  hasDrowDancingLights,
  hasDrowFaerieFireFreeCast,
  hasDrowFeyAncestry,
  hasMusicianFeat,
  hasStoneEndurance,
  hasWoodElfDruidcraft,
  hasWoodElfSpeedBonus,
  hasWoodElfTrance,
  stonesEnduranceReduction,
} from "./feats-and-species.ts";

export {
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
  extractMetamagicChoices,
  extractPactBladeBond,
  getBardicInspirationDie,
  getClassLevel,
  getMetamagicCost,
  hasMagicalCunning,
  hasPactOfTheBlade,
  METAMAGIC_OPTIONS,
  SORCERY_POINT_SLOT_COST,
} from "./class-features-casters.ts";

export const ENGINE_VERSION = "0.1.0" as const;
