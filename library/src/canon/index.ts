export {
  buildCanonicalManifest,
  canonicalSpellToRuntimeSpell,
  compileCanonicalEntities,
} from "./compile.ts";
export type { CanonicalCompileResult } from "./compile.ts";
export {
  getCanonicalEntityIdCandidates,
  normalizeCanonicalEntityId,
} from "./ids.ts";
export * from "./types.ts";
export { validateCanonicalEntity } from "./validate.ts";
