/**
 * Barrel re-export for progression schema.
 *
 * The actual table definitions live in domain-specific files:
 * - character-sources.ts — character_sources, xp_transactions, spend plans
 * - resource-pools.ts — character_resource_pools, resource_events
 * - hit-points.ts — character_hit_points, hit_point_events
 * - choice-state.ts — skill/feat/equipment/weapon mastery/metamagic/pact blade choices
 * - conditions.ts — character_conditions, condition_events
 *
 * This file re-exports everything so existing imports from "./progression.ts" continue to work.
 */

export {
  characterSourceKindEnum,
  characterSourceKinds,
  characterSources,
  characterSpendPlanKindEnum,
  characterSpendPlanKinds,
  characterSpendPlanStateEnum,
  characterSpendPlanStates,
  characterSpendPlans,
  xpTransactionCategories,
  xpTransactionCategoryEnum,
  xpTransactions,
} from "./character-sources.ts";

export type {
  CharacterSourceKind,
  CharacterSpendPlanKind,
  CharacterSpendPlanState,
  XpTransactionCategory,
} from "./character-sources.ts";

export {
  characterHitPoints,
  hitPointEventKindEnum,
  hitPointEventKinds,
  hitPointEvents,
} from "./hit-points.ts";

export type {
  HitPointEventKind,
} from "./hit-points.ts";

export {
  characterResourcePools,
  resourceEventKindEnum,
  resourceEventKinds,
  resourceEvents,
  restTypeEnum,
  restTypes,
} from "./resource-pools.ts";

export type {
  ResourceEventChange,
  ResourceEventKind,
  RestType,
} from "./resource-pools.ts";

export {
  characterEquipment,
  characterFeatChoices,
  characterMetamagicChoices,
  characterPactBladeBonds,
  characterSkillChoices,
  characterWeaponMasteries,
  equipmentSlotEnum,
  equipmentSlots,
  skillChoiceSourceEnum,
  skillChoiceSources,
} from "./choice-state.ts";

export type {
  EquipmentSlot,
  SkillChoiceSource,
} from "./choice-state.ts";

export {
  characterConditions,
  conditionEventKindEnum,
  conditionEventKinds,
  conditionEvents,
  conditionNameEnum,
  conditionNames,
} from "./conditions.ts";

export type {
  ConditionEventKind,
  ConditionName,
} from "./conditions.ts";
