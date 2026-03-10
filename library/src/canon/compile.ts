import type { Spell } from "../types/spell.ts";
import type {
  CanonEntityType,
  CanonicalAAAbility,
  CanonicalClass,
  CanonicalClassFeature,
  CanonicalCondition,
  CanonicalContentManifest,
  CanonicalEntity,
  CanonicalEquipment,
  CanonicalFeat,
  CanonicalRule,
  CanonicalSpecies,
  CanonicalSpell,
  PackId,
} from "./types.ts";

export interface CanonicalCompileResult {
  entities: CanonicalEntity[];
  manifest: CanonicalContentManifest;
  spells: CanonicalSpell[];
  rules: CanonicalRule[];
  conditions: CanonicalCondition[];
  equipment: CanonicalEquipment[];
  feats: CanonicalFeat[];
  species: CanonicalSpecies[];
  classes: CanonicalClass[];
  classFeatures: CanonicalClassFeature[];
  aaAbilities: CanonicalAAAbility[];
  runtimeSpells: Spell[];
}

export function canonicalSpellToRuntimeSpell(spell: CanonicalSpell): Spell {
  return {
    name: spell.name,
    level: spell.level,
    school: spell.school,
    classes: spell.classes,
    castingTime: spell.castingTime,
    ritual: spell.ritual,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    concentration: spell.concentration,
    description: spell.bodyMd,
    higherLevels: spell.higherLevelsMd,
  };
}

export function buildCanonicalManifest(
  entities: CanonicalEntity[],
): CanonicalContentManifest {
  const packs = {
    "srd-5e-2024": 0,
    "advanced-adventurers": 0,
    "campaign-private": 0,
  } satisfies Record<PackId, number>;
  const byType = {
    spell: 0,
    rule: 0,
    condition: 0,
    equipment: 0,
    feat: 0,
    species: 0,
    class: 0,
    "class-feature": 0,
    "aa-ability": 0,
  } satisfies Record<CanonEntityType, number>;

  for (const entity of entities) {
    packs[entity.packId] += 1;
    byType[entity.type] += 1;
  }

  return {
    totalEntities: entities.length,
    packs,
    byType,
  };
}

export function compileCanonicalEntities(
  entities: CanonicalEntity[],
): CanonicalCompileResult {
  const byName = <T extends CanonicalEntity>(left: T, right: T) =>
    left.name.localeCompare(right.name);

  const spells = entities
    .filter((entity): entity is CanonicalSpell => entity.type === "spell")
    .sort(byName);
  const rules = entities
    .filter((entity): entity is CanonicalRule => entity.type === "rule")
    .sort(byName);
  const conditions = entities
    .filter((entity): entity is CanonicalCondition => entity.type === "condition")
    .sort(byName);
  const equipment = entities
    .filter((entity): entity is CanonicalEquipment => entity.type === "equipment")
    .sort(byName);
  const feats = entities
    .filter((entity): entity is CanonicalFeat => entity.type === "feat")
    .sort(byName);
  const species = entities
    .filter((entity): entity is CanonicalSpecies => entity.type === "species")
    .sort(byName);
  const classes = entities
    .filter((entity): entity is CanonicalClass => entity.type === "class")
    .sort(byName);
  const classFeatures = entities
    .filter((entity): entity is CanonicalClassFeature => entity.type === "class-feature")
    .sort((left, right) =>
      left.classId.localeCompare(right.classId) ||
      left.level - right.level ||
      left.name.localeCompare(right.name)
    );
  const aaAbilities = entities
    .filter((entity): entity is CanonicalAAAbility => entity.type === "aa-ability")
    .sort(byName);

  return {
    entities,
    manifest: buildCanonicalManifest(entities),
    spells,
    rules,
    conditions,
    equipment,
    feats,
    species,
    classes,
    classFeatures,
    aaAbilities,
    runtimeSpells: spells.map(canonicalSpellToRuntimeSpell),
  };
}
