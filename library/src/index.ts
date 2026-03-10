// Types
export type * from "./types/index.ts";
export type * from "./canon/index.ts";

// Parsers
export { parseSpells } from "./parsers/index.ts";
export { parseMarkdown, splitByHeading, nodeText, isPageNumberLine } from "./parsers/index.ts";

// Engine
export {
  ENGINE_VERSION,
  computeCharacterState,
  evaluatePrerequisites,
  getAbilityModifier,
} from "./engine/index.ts";

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
