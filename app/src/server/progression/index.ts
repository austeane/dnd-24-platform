export type {
  ApplyConditionInput,
  CharacterConditionRecord,
  CharacterEquipmentRecord,
  CharacterFeatChoiceRecord,
  CharacterMetamagicChoiceRecord,
  CharacterPactBladeBondRecord,
  CharacterResourcePoolRecord,
  CharacterHitPointRecord,
  CharacterSkillChoiceRecord,
  CharacterSpendPlanDocument,
  CharacterSpendPlanOperation,
  CharacterSpendPlanPreview,
  CharacterSourceRecord,
  CharacterRuntimeState,
  CharacterSpendPlanRecord,
  CharacterSpendPlanSummary,
  CharacterWeaponMasteryRecord,
  CharacterXpLedgerSummary,
  CommitCharacterSpendPlanInput,
  ConditionEventRecord,
  HitPointEventRecord,
  CreateCharacterSpendPlanInput,
  CreateXpTransactionInput,
  InitializeResourcePoolsInput,
  HitPointMutationInput,
  NewCharacterSourceRecord,
  NewCharacterSpendPlanRecord,
  NewXpTransactionRecord,
  OverrideConditionInput,
  RecordCharacterSourceInput,
  RecordEquipmentInput,
  RecordFeatChoiceInput,
  RecordHitPointEventInput,
  RecordMetamagicChoiceInput,
  RecordPactBladeBondInput,
  RecordResourceEventInput,
  RecordSkillChoiceInput,
  RecordWeaponMasteryInput,
  RemoveConditionInput,
  ResourceEventRecord,
  SyncHitPointsInput,
  RestInput,
  RestoreResourceInput,
  SpendResourceInput,
  UpdateEquipmentInput,
  XpTransactionRecord,
} from "./types.ts";
export {
  recordXpTransaction,
  listCharacterXpTransactions,
  getCharacterXpLedgerSummary,
} from "./xp-transactions.ts";
export {
  recordCharacterSource,
  listCharacterSources,
} from "./character-sources.ts";
export { getCharacterRuntimeState } from "./character-state.ts";
export { syncCharacterDerivedState } from "./derived-state.ts";
export {
  previewCharacterSpendPlan,
  createCharacterSpendPlan,
  listCharacterSpendPlans,
  commitCharacterSpendPlan,
} from "./spend-plan-lifecycle.ts";
export {
  recordSkillChoice,
  listCharacterSkillChoices,
  deleteSkillChoice,
  recordFeatChoice,
  listCharacterFeatChoices,
  recordEquipment,
  updateEquipment,
  listCharacterEquipment,
  deleteEquipment,
  recordWeaponMastery,
  listCharacterWeaponMasteries,
  recordMetamagicChoice,
  listCharacterMetamagicChoices,
  recordPactBladeBond,
  getActivePactBladeBond,
  unbondPactBlade,
} from "./choice-state.ts";
export {
  validateSkillChoice,
  validateFeatChoice,
  recordEquipmentBulk,
  validateAndRecordWeaponMastery,
  validateAndRecordMetamagicChoice,
  validateAndRecordPactBladeBond,
  commitSpendPlanChoices,
} from "./choice-service.ts";
export {
  getCharacterHitPointState,
  syncCharacterHitPoints,
  applyDamage,
  healHitPoints,
  gainTemporaryHitPoints,
  replaceTemporaryHitPoints,
  clearTemporaryHitPoints,
  restoreHitPointsForLongRest,
  recordHitPointEvent,
  listCharacterHitPointEvents,
} from "./hit-point-state.ts";
export {
  listCharacterResourcePools,
  getCharacterResourcePool,
  initializeResourcePools,
  spendResource,
  restoreResource,
  performShortRest,
  performLongRest,
  recordResourceEvent,
  listCharacterResourceEvents,
} from "./resource-state.ts";
export {
  applyCondition,
  removeCondition,
  overrideCondition,
  listActiveConditions,
  listConditionEvents,
} from "./condition-state.ts";
export {
  applyConditionWithEffects,
  removeConditionWithEffects,
  overrideConditionWithEffects,
  getActiveConditionsWithEffects,
  checkConditionImmunity,
} from "./condition-service.ts";
export {
  getSpellSlotState,
  hasFreeCastAvailable,
  initializeSpellSlotPools,
  restoreSpellSlot,
  spendFreeCast,
  spendSpellSlot,
} from "./spell-slot-state.ts";
export type {
  RestoreSpellSlotInput,
  SpendSpellSlotInput,
} from "./spell-slot-state.ts";
export {
  syncResourcePoolsFromState,
  spendResourceWithValidation,
  restoreResourceWithValidation,
  orchestrateShortRest,
  orchestrateLongRest,
} from "./resource-service.ts";
export {
  executeShortRest,
  executeLongRest,
  previewRestReset,
} from "./rest-service.ts";
