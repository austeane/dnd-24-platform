import type { AAPrerequisite } from "../types/aa-ability.ts";
import type {
  Effect,
  EffectAbilityName,
  ProficiencyCategory,
} from "../types/effect.ts";
import type { CanonicalCondition, CanonicalEntity, CanonicalRule, CanonicalSpell } from "./types.ts";
import {
  adaptationModes,
  canonEntityTypes,
  packIds,
  reviewStatuses,
  spellInteractionTypes,
  sourceEditions,
  type CanonEntityBase,
  type CanonEntityType,
  type CanonicalAAAbility,
  type CanonicalClass,
  type CanonicalClassFeature,
  type CanonicalEquipment,
  type CanonicalFeat,
  type CanonicalOverlayTarget,
  type CanonicalSpecies,
  type DerivedFromReference,
  type JudgementCall,
  type SourceReference,
  type SpellAvailability,
} from "./types.ts";

const abilityNames = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;
const proficiencyCategories = [
  "saving-throw",
  "skill",
  "weapon",
  "armor",
  "tool",
  "language",
] as const;
const actionTimings = ["action", "bonus-action", "reaction", "free", "special"] as const;
const restTypes = ["short", "long"] as const;
const modifierTargets = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "ac",
  "initiative",
  "passive-perception",
  "proficiency-bonus",
  "speed",
  "hp-max",
  "melee-attack",
  "ranged-attack",
  "spell-attack",
  "melee-damage",
  "ranged-damage",
  "spell-dc",
] as const;

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function expectObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(path, "expected a non-empty string");
  }
  return value.trim();
}

function expectOptionalString(value: unknown, path: string): string | undefined {
  if (value == null) {
    return undefined;
  }
  return expectString(value, path);
}

function expectOptionalNumber(value: unknown, path: string): number | undefined {
  if (value == null) {
    return undefined;
  }
  return expectNumber(value, path);
}

function expectInteger(value: unknown, path: string): number {
  const numberValue = expectNumber(value, path);
  if (!Number.isInteger(numberValue)) {
    fail(path, "expected an integer");
  }
  return numberValue;
}

function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    fail(path, "expected a boolean");
  }
  return value;
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(path, "expected a number");
  }
  return value;
}

function expectStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }
  return value.map((entry, index) => expectString(entry, `${path}[${index}]`));
}

function expectEnumArray<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  path: string,
): T[number][] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }

  return value.map((entry, index) =>
    expectEnumValue(entry, allowed, `${path}[${index}]`)
  );
}

function expectEnumValue<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  path: string,
): T[number] {
  const stringValue = expectString(value, path);
  if (!allowed.includes(stringValue)) {
    fail(path, `expected one of: ${allowed.join(", ")}`);
  }
  return stringValue as T[number];
}

function expectEffects(value: unknown, path: string): Effect[] {
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }

  return value.map((entry, index) => expectEffect(entry, `${path}[${index}]`));
}

function expectEffect(value: unknown, path: string): Effect {
  const record = expectObject(value, path);
  const type = expectString(record.type, `${path}.type`);

  switch (type) {
    case "modifier":
      return {
        type,
        target: expectEnumValue(record.target, modifierTargets, `${path}.target`),
        value: expectNumber(record.value, `${path}.value`),
        condition: expectOptionalString(record.condition, `${path}.condition`),
      };
    case "proficiency":
      return {
        type,
        category: expectEnumValue(
          record.category,
          proficiencyCategories,
          `${path}.category`,
        ) as ProficiencyCategory,
        value: expectString(record.value, `${path}.value`),
      };
    case "expertise":
      return {
        type,
        skill: expectString(record.skill, `${path}.skill`),
      };
    case "resistance":
      return {
        type,
        damageType: expectString(record.damageType, `${path}.damageType`),
        condition: expectOptionalString(record.condition, `${path}.condition`),
      };
    case "immunity":
      return {
        type,
        damageType: expectString(record.damageType, `${path}.damageType`),
      };
    case "grant-action": {
      const action = expectObject(record.action, `${path}.action`);
      return {
        type,
        action: {
          name: expectString(action.name, `${path}.action.name`),
          timing: expectEnumValue(action.timing, actionTimings, `${path}.action.timing`),
          description: expectString(action.description, `${path}.action.description`),
        },
      };
    }
    case "grant-resource": {
      const resource = expectObject(record.resource, `${path}.resource`);
      return {
        type,
        resource: {
          name: expectString(resource.name, `${path}.resource.name`),
          maxUses: expectInteger(resource.maxUses, `${path}.resource.maxUses`),
          resetOn: expectEnumValue(resource.resetOn, restTypes, `${path}.resource.resetOn`),
        },
      };
    }
    case "grant-scaling-resource": {
      const resource = expectObject(record.resource, `${path}.resource`);
      return {
        type,
        resource: {
          name: expectString(resource.name, `${path}.resource.name`),
          baseUses: expectInteger(resource.baseUses, `${path}.resource.baseUses`),
          ability: resource.ability == null
            ? undefined
            : expectEnumValue(
                resource.ability,
                abilityNames,
                `${path}.resource.ability`,
              ) as EffectAbilityName,
          mode: resource.mode == null
            ? undefined
            : expectEnumValue(
                resource.mode,
                ["ability-modifier", "proficiency-bonus"] as const,
                `${path}.resource.mode`,
              ),
          bonus: expectOptionalNumber(resource.bonus, `${path}.resource.bonus`),
          minimum: expectInteger(resource.minimum, `${path}.resource.minimum`),
          resetOn: expectEnumValue(resource.resetOn, restTypes, `${path}.resource.resetOn`),
        },
      };
    }
    case "grant-spell-access": {
      const spell = expectObject(record.spell ?? record, `${path}.spell`);
      return {
        type,
        spell: {
          spellName: expectString(spell.spellName, `${path}.spell.spellName`),
          spellEntityId: expectOptionalString(
            spell.spellEntityId,
            `${path}.spell.spellEntityId`,
          ),
          spellPackId: expectOptionalString(
            spell.spellPackId,
            `${path}.spell.spellPackId`,
          ),
          alwaysPrepared: expectBoolean(
            spell.alwaysPrepared,
            `${path}.spell.alwaysPrepared`,
          ),
          source: expectString(spell.source, `${path}.spell.source`),
        },
      };
    }
    case "grant-spell-slots": {
      const pool = expectObject(record.pool, `${path}.pool`);
      return {
        type,
        pool: {
          slots: pool.slots == null
            ? []
            : (() => {
                if (!Array.isArray(pool.slots)) {
                  fail(`${path}.pool.slots`, "expected an array");
                }
                return pool.slots.map((slot, index) =>
                  expectInteger(slot, `${path}.pool.slots[${index}]`)
                );
              })(),
          resetOn: expectEnumValue(pool.resetOn, restTypes, `${path}.pool.resetOn`),
          source: expectString(pool.source, `${path}.pool.source`),
        },
      };
    }
    case "grant-spell-capacity": {
      const capacity = expectObject(record.capacity, `${path}.capacity`);
      return {
        type,
        capacity: {
          kind: expectEnumValue(
            capacity.kind,
            ["cantrips", "prepared-spells", "known-spells"] as const,
            `${path}.capacity.kind`,
          ),
          count: expectInteger(capacity.count, `${path}.capacity.count`),
        },
      };
    }
    case "grant-trait": {
      const trait = expectObject(record.trait, `${path}.trait`);
      return {
        type,
        trait: {
          name: expectString(trait.name, `${path}.trait.name`),
          description: expectString(trait.description, `${path}.trait.description`),
          tags: trait.tags == null
            ? undefined
            : expectStringArray(trait.tags, `${path}.trait.tags`),
          },
        };
      }
    case "grant-sense": {
      const sense = expectObject(record.sense, `${path}.sense`);
      return {
        type,
        sense: {
          sense: expectString(sense.sense, `${path}.sense.sense`),
          range: expectInteger(sense.range, `${path}.sense.range`),
        },
      };
    }
    case "set-ac-formula": {
      const formula = expectObject(record.formula, `${path}.formula`);
      return {
        type,
        formula: {
          base: expectInteger(formula.base, `${path}.formula.base`),
          abilityModifiers: expectEnumArray(
            formula.abilityModifiers,
            abilityNames,
            `${path}.formula.abilityModifiers`,
          ),
          maxAC: expectOptionalNumber(formula.maxAC, `${path}.formula.maxAC`),
        },
      };
    }
    case "extra-attack":
      return {
        type,
        count: expectInteger(record.count, `${path}.count`),
      };
    case "speed-bonus":
      return {
        type,
        value: expectInteger(record.value, `${path}.value`),
        movementType: expectString(record.movementType, `${path}.movementType`),
      };
    case "unmodeled":
      return {
        type,
        description: expectString(record.description, `${path}.description`),
      };
    default:
      fail(path, `unsupported effect type ${type}`);
  }
}

function expectSourceReference(value: unknown, path: string): SourceReference {
  const record = expectObject(value, path);
  return {
    sourceTitle: expectString(record.sourceTitle, `${path}.sourceTitle`),
    locator: expectString(record.locator, `${path}.locator`),
  };
}

function expectDerivedFromReference(
  value: unknown,
  path: string,
): DerivedFromReference {
  const record = expectObject(value, path);
  const packId = record.packId == null
    ? undefined
    : expectEnumValue(record.packId, packIds, `${path}.packId`);

  return {
    label: expectString(record.label, `${path}.label`),
    sourceEdition: expectEnumValue(
      record.sourceEdition,
      sourceEditions,
      `${path}.sourceEdition`,
    ),
    sourceReference: expectSourceReference(
      record.sourceReference,
      `${path}.sourceReference`,
    ),
    packId,
    entityId: expectOptionalString(record.entityId, `${path}.entityId`),
  };
}

function expectJudgementCall(value: unknown, path: string): JudgementCall {
  const record = expectObject(value, path);
  if (record.isJudgementCall !== true) {
    fail(`${path}.isJudgementCall`, "expected true");
  }
  if (!Array.isArray(record.derivedFrom) || record.derivedFrom.length < 2) {
    fail(`${path}.derivedFrom`, "expected at least two source references");
  }

  return {
    isJudgementCall: true,
    judgementBasis: expectString(record.judgementBasis, `${path}.judgementBasis`),
    derivedFrom: record.derivedFrom.map((entry, index) =>
      expectDerivedFromReference(entry, `${path}.derivedFrom[${index}]`)
    ) as JudgementCall["derivedFrom"],
  };
}

function expectBase(
  frontmatter: Record<string, unknown>,
  bodyMd: string,
  path: string,
): CanonEntityBase {
  const type = expectEnumValue(frontmatter.type, canonEntityTypes, `${path}.type`);
  const adaptationMode = expectEnumValue(
    frontmatter.adaptationMode,
    adaptationModes,
    `${path}.adaptationMode`,
  );
  const judgement = frontmatter.judgement == null
    ? null
    : expectJudgementCall(frontmatter.judgement, `${path}.judgement`);
  const reviewStatus = expectEnumValue(
    frontmatter.reviewStatus,
    reviewStatuses,
    `${path}.reviewStatus`,
  );

  if (adaptationMode === "ported-with-judgement" && judgement == null) {
    fail(path, "ported-with-judgement entries require judgement metadata");
  }
  if (adaptationMode !== "ported-with-judgement" && judgement != null) {
    fail(path, "judgement metadata is only valid for ported-with-judgement entries");
  }
  if (adaptationMode === "ported-with-judgement" && reviewStatus !== "llm-judgement") {
    fail(path, "ported-with-judgement entries must use reviewStatus=llm-judgement");
  }

  return {
    type,
    id: expectString(frontmatter.id, `${path}.id`),
    slug: expectString(frontmatter.slug, `${path}.slug`),
    name: expectString(frontmatter.name, `${path}.name`),
    packId: expectEnumValue(frontmatter.packId, packIds, `${path}.packId`),
    sourceEdition: expectEnumValue(
      frontmatter.sourceEdition,
      sourceEditions,
      `${path}.sourceEdition`,
    ),
    sourceReference: expectSourceReference(
      frontmatter.sourceReference,
      `${path}.sourceReference`,
    ),
    adaptationMode,
    judgement,
    reviewStatus,
    summary: expectOptionalString(frontmatter.summary, `${path}.summary`),
    tags: frontmatter.tags == null
      ? undefined
      : expectStringArray(frontmatter.tags, `${path}.tags`),
    bodyMd: bodyMd.trim(),
  };
}

function expectAvailability(value: unknown, path: string): SpellAvailability {
  if (value !== "class-list" && value !== "aa-universal") {
    fail(path, "expected class-list or aa-universal");
  }
  return value;
}

function expectPrerequisites(value: unknown, path: string): AAPrerequisite[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }
  return value.map((entry, index) => {
    const record = expectObject(entry, `${path}[${index}]`);
    return {
      type: expectString(record.type, `${path}[${index}].type`) as AAPrerequisite["type"],
      value: expectString(record.value, `${path}[${index}].value`),
    };
  });
}

function expectOverlayTarget(
  value: unknown,
  path: string,
): CanonicalOverlayTarget {
  const record = expectObject(value, path);
  return {
    packId: expectEnumValue(record.packId, packIds, `${path}.packId`),
    entityId: expectString(record.entityId, `${path}.entityId`),
  };
}

function validateSpell(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalSpell {
  const availability = expectAvailability(frontmatter.availability, `${path}.availability`);
  const classes = frontmatter.classes == null
    ? []
    : expectStringArray(frontmatter.classes, `${path}.classes`);

  if (availability === "class-list" && classes.length === 0) {
    fail(path, "class-list spells require at least one class");
  }
  if (base.packId === "advanced-adventurers" && availability !== "aa-universal") {
    fail(path, "advanced-adventurers spell entries must use availability=aa-universal");
  }

  const componentsRecord = expectObject(frontmatter.components, `${path}.components`);
  const overlayTarget = frontmatter.overlayTarget == null
    ? undefined
    : expectOverlayTarget(frontmatter.overlayTarget, `${path}.overlayTarget`);

  return {
    ...base,
    type: "spell",
    level: expectNumber(frontmatter.level, `${path}.level`),
    school: expectString(frontmatter.school, `${path}.school`) as CanonicalSpell["school"],
    classes,
    availability,
    castingTime: expectString(frontmatter.castingTime, `${path}.castingTime`),
    ritual: expectBoolean(frontmatter.ritual, `${path}.ritual`),
    range: expectString(frontmatter.range, `${path}.range`),
    components: {
      verbal: expectBoolean(componentsRecord.verbal, `${path}.components.verbal`),
      somatic: expectBoolean(componentsRecord.somatic, `${path}.components.somatic`),
      material: componentsRecord.material == null
        ? undefined
        : expectString(componentsRecord.material, `${path}.components.material`),
    },
    duration: expectString(frontmatter.duration, `${path}.duration`),
    concentration: expectBoolean(
      frontmatter.concentration,
      `${path}.concentration`,
    ),
    higherLevelsLabel: expectOptionalString(
      frontmatter.higherLevelsLabel,
      `${path}.higherLevelsLabel`,
    ),
    higherLevelsMd: expectOptionalString(
      frontmatter.higherLevelsMd,
      `${path}.higherLevelsMd`,
    ),
    overlayTarget,
    aaSourcePage: expectOptionalNumber(frontmatter.aaSourcePage, `${path}.aaSourcePage`),
    aaSourceImage: expectOptionalString(frontmatter.aaSourceImage, `${path}.aaSourceImage`),
    aaSection: expectOptionalString(frontmatter.aaSection, `${path}.aaSection`),
    linkedAaAbilityIds: frontmatter.linkedAaAbilityIds == null
      ? undefined
      : expectStringArray(frontmatter.linkedAaAbilityIds, `${path}.linkedAaAbilityIds`),
    interactionTypes: frontmatter.interactionTypes == null
      ? undefined
      : expectEnumArray(
          frontmatter.interactionTypes,
          spellInteractionTypes,
          `${path}.interactionTypes`,
        ),
  };
}

function validateRule(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalRule {
  const category = expectString(frontmatter.ruleCategory, `${path}.ruleCategory`);
  if (!["core", "spellcasting", "combat", "conditions"].includes(category)) {
    fail(`${path}.ruleCategory`, "unexpected rule category");
  }

  return {
    ...base,
    type: "rule",
    ruleCategory: category as CanonicalRule["ruleCategory"],
  };
}

function validateCondition(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalCondition {
  return {
    ...base,
    type: "condition",
    effects: expectStringArray(frontmatter.effects, `${path}.effects`),
  };
}

function validateEquipment(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalEquipment {
  return {
    ...base,
    type: "equipment",
    equipmentCategory: expectString(
      frontmatter.equipmentCategory,
      `${path}.equipmentCategory`,
    ),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

function validateFeat(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalFeat {
  return {
    ...base,
    type: "feat",
    featCategory: expectString(frontmatter.featCategory, `${path}.featCategory`),
    prerequisites: frontmatter.prerequisites == null
      ? []
      : expectStringArray(frontmatter.prerequisites, `${path}.prerequisites`),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

function validateSpecies(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalSpecies {
  return {
    ...base,
    type: "species",
    traits: frontmatter.traits == null
      ? []
      : expectStringArray(frontmatter.traits, `${path}.traits`),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

function validateClass(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalClass {
  return {
    ...base,
    type: "class",
    hitDie: expectNumber(frontmatter.hitDie, `${path}.hitDie`),
    primaryAbilities: frontmatter.primaryAbilities == null
      ? []
      : expectStringArray(frontmatter.primaryAbilities, `${path}.primaryAbilities`),
    savingThrowProficiencies: frontmatter.savingThrowProficiencies == null
      ? []
      : expectStringArray(
          frontmatter.savingThrowProficiencies,
          `${path}.savingThrowProficiencies`,
        ),
    skillOptions: frontmatter.skillOptions == null
      ? []
      : expectStringArray(frontmatter.skillOptions, `${path}.skillOptions`),
    skillChoiceCount: frontmatter.skillChoiceCount == null
      ? 0
      : expectInteger(frontmatter.skillChoiceCount, `${path}.skillChoiceCount`),
    armorProficiencies: frontmatter.armorProficiencies == null
      ? []
      : expectStringArray(frontmatter.armorProficiencies, `${path}.armorProficiencies`),
    weaponProficiencies: frontmatter.weaponProficiencies == null
      ? []
      : expectStringArray(frontmatter.weaponProficiencies, `${path}.weaponProficiencies`),
    toolProficiencies: frontmatter.toolProficiencies == null
      ? []
      : expectStringArray(frontmatter.toolProficiencies, `${path}.toolProficiencies`),
    spellcastingAbility: frontmatter.spellcastingAbility == null
      ? undefined
      : expectEnumValue(
          frontmatter.spellcastingAbility,
          abilityNames,
          `${path}.spellcastingAbility`,
        ),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

function validateClassFeature(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalClassFeature {
  return {
    ...base,
    type: "class-feature",
    classId: expectString(frontmatter.classId, `${path}.classId`),
    level: expectNumber(frontmatter.level, `${path}.level`),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

function validateAaAbility(
  base: CanonEntityBase,
  frontmatter: Record<string, unknown>,
  path: string,
): CanonicalAAAbility {
  return {
    ...base,
    type: "aa-ability",
    expCost: expectNumber(frontmatter.expCost, `${path}.expCost`),
    category: expectString(frontmatter.category, `${path}.category`) as CanonicalAAAbility["category"],
    repeatable: expectBoolean(frontmatter.repeatable, `${path}.repeatable`),
    prerequisites: frontmatter.prerequisites == null
      ? []
      : expectPrerequisites(frontmatter.prerequisites, `${path}.prerequisites`),
    effects: expectEffects(frontmatter.effects, `${path}.effects`),
  };
}

export function validateCanonicalEntity(
  frontmatter: Record<string, unknown>,
  bodyMd: string,
  path: string,
): CanonicalEntity {
  const base = expectBase(frontmatter, bodyMd, path);

  switch (base.type as CanonEntityType) {
    case "spell":
      return validateSpell(base, frontmatter, path);
    case "rule":
      return validateRule(base, frontmatter, path);
    case "condition":
      return validateCondition(base, frontmatter, path);
    case "equipment":
      return validateEquipment(base, frontmatter, path);
    case "feat":
      return validateFeat(base, frontmatter, path);
    case "species":
      return validateSpecies(base, frontmatter, path);
    case "class":
      return validateClass(base, frontmatter, path);
    case "class-feature":
      return validateClassFeature(base, frontmatter, path);
    case "aa-ability":
      return validateAaAbility(base, frontmatter, path);
    default:
      fail(path, `unsupported type ${(base as CanonEntityBase).type}`);
  }
}
