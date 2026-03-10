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

export const ENGINE_VERSION = "0.1.0" as const;
