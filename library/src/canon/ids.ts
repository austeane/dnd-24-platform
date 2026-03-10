const prefixedEntityPattern = /^(class|class-feature|feat|equipment|species):(.*)$/;
const normalizedEntityPattern = /^(class|class-feature|feat|equipment|species)-(.*)$/;

export function normalizeCanonicalEntityId(
  entityId: string | null | undefined,
): string | undefined {
  if (!entityId) {
    return undefined;
  }

  const prefixedMatch = entityId.match(prefixedEntityPattern);
  if (prefixedMatch) {
    const [, prefix, suffix] = prefixedMatch;
    return `${prefix}-${suffix}`;
  }

  return entityId;
}

export function getCanonicalEntityIdCandidates(
  entityId: string | null | undefined,
): string[] {
  if (!entityId) {
    return [];
  }

  const candidates = new Set<string>([entityId]);
  const normalized = normalizeCanonicalEntityId(entityId);
  if (normalized) {
    candidates.add(normalized);
  }

  const normalizedMatch = entityId.match(normalizedEntityPattern);
  if (normalizedMatch) {
    const [, prefix, suffix] = normalizedMatch;
    candidates.add(`${prefix}:${suffix}`);
  }

  return [...candidates];
}
