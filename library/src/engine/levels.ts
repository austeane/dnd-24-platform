import type { SourceWithEffects } from "../types/effect.ts";

function getLevelsGranted(source: SourceWithEffects["source"]): number {
  const payloadLevels = source.payload?.levelsGranted;
  if (typeof payloadLevels === "number" && Number.isInteger(payloadLevels) && payloadLevels > 0) {
    return payloadLevels;
  }

  return Math.max(source.rank ?? 1, 1);
}

export function getCharacterLevel(sources: SourceWithEffects[]): number {
  return sources.reduce((sum, { source }) => {
    if (source.kind !== "class-level") {
      return sum;
    }

    return sum + getLevelsGranted(source);
  }, 0);
}
