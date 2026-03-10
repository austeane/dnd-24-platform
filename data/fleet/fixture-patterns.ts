/**
 * Fixture infrastructure for fleet batch testing.
 *
 * Each batch that requires `fixtures` or `live-roster` gates should use these
 * helpers to build deterministic test inputs from the verified roster data.
 *
 * Usage in a batch test:
 *   import { loadVerifiedRoster, buildCharacterFixture } from "../../data/fleet/fixture-patterns.ts";
 *   const roster = loadVerifiedRoster();
 *   const ronan = buildCharacterFixture(roster, "ronan-wildspark");
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CharacterBaseSnapshot,
  CharacterComputationInput,
  Effect,
  SourceWithEffects,
} from "../../library/src/types/index.ts";
import type { PackId } from "../../library/src/canon/types.ts";
import {
  getCanonicalEffectsForSource,
  getCanonicalSpellByName,
  normalizeCanonicalEntityId,
} from "../../library/src/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const intakePath = path.join(rootDir, "data", "real-campaign-intake", "verified-characters.json");

export interface VerifiedRoster {
  campaign: {
    progressionMode: "standard" | "aa-only" | "hybrid";
    enabledPackIds: string[];
  };
  characters: VerifiedCharacterData[];
}

export interface SkillChoiceData {
  skillName: string;
  source: string;
  sourceLabel: string;
  hasExpertise?: boolean;
}

export interface FeatChoiceData {
  featEntityId: string;
  featPackId?: string | null;
  featLabel: string;
  subChoicesJson?: Record<string, unknown> | null;
  sourceLabel: string;
}

export interface EquipmentData {
  itemEntityId: string;
  itemPackId?: string | null;
  itemLabel: string;
  quantity: number;
  equipped: boolean;
  slot?: string | null;
}

export interface WeaponMasteryData {
  weaponEntityId: string;
  weaponPackId?: string | null;
  weaponLabel: string;
  masteryProperty: string;
}

export interface MetamagicChoiceData {
  metamagicOption: string;
  sourceLabel: string;
}

export interface PactBladeBondData {
  weaponEntityId?: string | null;
  weaponPackId?: string | null;
  weaponLabel: string;
  isMagicWeapon: boolean;
}

export interface VerifiedCharacterData {
  reviewStatus: string;
  identity: {
    name: string;
    slug: string;
    className: string;
    classId: string;
    level: number;
  };
  tableState: {
    armorClass: number;
    maxHp: number;
    speed: number;
    passivePerception?: number;
  };
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  spellcasting: {
    ability: CharacterBaseSnapshot["spellcastingAbility"];
    knownSpells: string[];
  } | null;
  sourceLedger: {
    features: SeedFeature[];
  };
  skillChoices?: SkillChoiceData[];
  featChoices?: FeatChoiceData[];
  equipment?: EquipmentData[];
  weaponMasteries?: WeaponMasteryData[];
  metamagicChoices?: MetamagicChoiceData[];
  pactBladeBond?: PactBladeBondData | null;
  xpLedger: Array<{
    id: string;
    amount: number;
    category: "award" | "spend-aa" | "spend-level" | "refund" | "adjustment";
    note: string;
    sessionId?: string | null;
  }>;
}

interface SeedFeature {
  id: string;
  label: string;
  sourceKind: string;
  sourceEntityId: string;
  sourcePackId?: string | null;
  rank?: number;
  description?: string;
  effects: Effect[];
  notes: string[];
}

const defaultClassFeatureIds: Record<string, Array<{ minLevel: number; entityId: string; label: string }>> = {
  fighter: [
    { minLevel: 1, entityId: "class-feature:second-wind", label: "Second Wind" },
    { minLevel: 1, entityId: "class-feature:weapon-mastery", label: "Weapon Mastery" },
  ],
  druid: [
    { minLevel: 2, entityId: "class-feature:druidic-spellcasting-2", label: "Druidic Spellcasting (Level 2)" },
    { minLevel: 2, entityId: "class-feature:wild-shape", label: "Wild Shape" },
    { minLevel: 2, entityId: "class-feature:wild-companion", label: "Wild Companion" },
  ],
  warlock: [
    { minLevel: 2, entityId: "class-feature:pact-magic-2", label: "Pact Magic (Level 2)" },
    { minLevel: 2, entityId: "class-feature:magical-cunning", label: "Magical Cunning" },
  ],
  bard: [
    { minLevel: 2, entityId: "class-feature:bard-spellcasting-2", label: "Bard Spellcasting (Level 2)" },
    { minLevel: 1, entityId: "class-feature:bardic-inspiration", label: "Bardic Inspiration" },
  ],
  sorcerer: [
    { minLevel: 2, entityId: "class-feature:sorcerous-spellcasting-2", label: "Sorcerous Spellcasting (Level 2)" },
    { minLevel: 2, entityId: "class-feature:font-of-magic", label: "Font of Magic" },
    { minLevel: 2, entityId: "class-feature:metamagic", label: "Metamagic" },
  ],
};

function mergeEffects(canonical: Effect[], inline: Effect[]): Effect[] {
  const merged = [...canonical, ...inline];
  const seen = new Set<string>();
  return merged.filter((effect) => {
    const key = JSON.stringify(effect);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSeedFeatures(character: VerifiedCharacterData): SeedFeature[] {
  const merged = new Map<string, SeedFeature>();

  for (const blueprint of defaultClassFeatureIds[character.identity.classId] ?? []) {
    if (character.identity.level < blueprint.minLevel) continue;
    const normalized = normalizeCanonicalEntityId(blueprint.entityId) ?? blueprint.entityId;
    const key = `class-feature:${normalized}:1`;
    merged.set(key, {
      id: blueprint.entityId.replace("class-feature:", ""),
      label: blueprint.label,
      sourceKind: "class-feature",
      sourceEntityId: blueprint.entityId,
      sourcePackId: "srd-5e-2024",
      effects: [],
      notes: [],
    });
  }

  for (const feature of character.sourceLedger.features) {
    const normalized = normalizeCanonicalEntityId(feature.sourceEntityId) ?? feature.sourceEntityId;
    const key = `${feature.sourceKind}:${normalized}:${feature.rank ?? 1}`;
    merged.set(key, feature);
  }

  return [...merged.values()];
}

/** Load the verified roster from disk. Safe to call in tests (sync read). */
export function loadVerifiedRoster(): VerifiedRoster {
  const raw = readFileSync(intakePath, "utf8");
  return JSON.parse(raw) as VerifiedRoster;
}

/** Build a CharacterComputationInput for a single character by slug. */
export function buildCharacterFixture(
  roster: VerifiedRoster,
  slug: string,
): CharacterComputationInput {
  const character = roster.characters.find((c) => c.identity.slug === slug);
  if (!character) {
    throw new Error(`Character "${slug}" not found in verified roster`);
  }

  const enabledPackIds = roster.campaign.enabledPackIds as PackId[];
  const seedFeatures = buildSeedFeatures(character);

  const derivedWalkSpeedBonus = seedFeatures.reduce((sum, feature) => {
    const canonical = getCanonicalEffectsForSource(feature.sourcePackId ?? undefined, feature.sourceEntityId);
    const combined = [...canonical, ...feature.effects];
    return sum + combined.reduce((inner, effect) => {
      if (effect.type !== "speed-bonus" || effect.movementType !== "walk") return inner;
      return inner + effect.value;
    }, 0);
  }, 0);

  const base: CharacterBaseSnapshot = {
    name: character.identity.name,
    progressionMode: roster.campaign.progressionMode,
    abilityScores: character.abilities,
    baseArmorClass: character.tableState.armorClass,
    baseMaxHP: character.tableState.maxHp,
    baseSpeed: Math.max(character.tableState.speed - derivedWalkSpeedBonus, 0),
    basePassivePerception: character.tableState.passivePerception,
    spellcastingAbility: character.spellcasting?.ability,
  };

  const sources: SourceWithEffects[] = [];

  sources.push({
    source: {
      id: `fixture:${slug}:class:${character.identity.classId}`,
      kind: "class-level",
      name: `${character.identity.className} ${character.identity.level}`,
      rank: character.identity.level,
    },
    effects: [],
  });

  if (character.spellcasting && character.spellcasting.knownSpells.length > 0) {
    sources.push({
      source: {
        id: `fixture:${slug}:spell-list`,
        kind: "class-feature",
        name: `${character.identity.className} spell list`,
      },
      effects: character.spellcasting.knownSpells.map((spellName) => {
        const spell = getCanonicalSpellByName(spellName, enabledPackIds);
        return {
          type: "grant-spell-access" as const,
          spell: {
            spellName,
            spellEntityId: spell?.id,
            spellPackId: spell?.packId,
            alwaysPrepared: false,
            source: character.identity.className,
          },
        };
      }),
    });
  }

  for (const feature of seedFeatures) {
    const canonical = getCanonicalEffectsForSource(feature.sourcePackId ?? undefined, feature.sourceEntityId);
    const payload: Record<string, unknown> = {};

    // Attach feat sub-choices to the source payload so engine functions can access them
    if (feature.sourceKind === "feat" && character.featChoices) {
      const matchingFeat = character.featChoices.find(
        (fc) => fc.featEntityId === feature.sourceEntityId,
      );
      if (matchingFeat?.subChoicesJson) {
        payload["subChoicesJson"] = matchingFeat.subChoicesJson;
      }
    }

    // Attach metamagic choices to the metamagic source payload
    if (feature.sourceEntityId === "class-feature:metamagic" && character.metamagicChoices) {
      payload["metamagicChoices"] = character.metamagicChoices.map((m) => m.metamagicOption);
    }

    // Attach pact blade bond to the pact-of-the-blade source payload
    if (feature.sourceEntityId === "class-feature:pact-of-the-blade" && character.pactBladeBond) {
      payload["pactBladeBond"] = {
        weaponLabel: character.pactBladeBond.weaponLabel,
        weaponEntityId: character.pactBladeBond.weaponEntityId ?? undefined,
        isMagicWeapon: character.pactBladeBond.isMagicWeapon,
      };
    }

    sources.push({
      source: {
        id: `fixture:${slug}:feature:${feature.id}`,
        kind: feature.sourceKind as SourceWithEffects["source"]["kind"],
        name: feature.label,
        description: feature.description,
        entityId: feature.sourceEntityId,
        packId: feature.sourcePackId ?? undefined,
        rank: feature.rank,
        ...(Object.keys(payload).length > 0 ? { payload } : {}),
      },
      effects: mergeEffects(canonical, feature.effects),
    });
  }

  // --- Skill choice sources: translate to proficiency effects ---
  if (character.skillChoices && character.skillChoices.length > 0) {
    const skillEffects: Effect[] = character.skillChoices.flatMap((sc) => {
      const effects: Effect[] = [
        { type: "proficiency", category: "skill", value: sc.skillName },
      ];
      if (sc.hasExpertise) {
        effects.push({ type: "expertise", skill: sc.skillName });
      }
      return effects;
    });

    sources.push({
      source: {
        id: `fixture:${slug}:skill-choices`,
        kind: "override",
        name: "Skill Proficiencies",
      },
      effects: skillEffects,
    });
  }

  // --- Equipment sources: add equipped weapons as equipment sources for attack profiles ---
  // Armor/shield AC is already captured in baseArmorClass from the sheet value.
  // Only weapons need explicit equipment sources for the attack profile engine.
  if (character.equipment && character.equipment.length > 0) {
    for (const item of character.equipment) {
      if (!item.equipped) continue;
      // Skip armor and shields — their AC contribution is in baseArmorClass
      if (item.slot === "armor" || item.slot === "off-hand") continue;
      sources.push({
        source: {
          id: `fixture:${slug}:equip:${item.itemEntityId}`,
          kind: "equipment",
          name: item.itemLabel,
          entityId: item.itemEntityId,
        },
        effects: getCanonicalEffectsForSource("srd-5e-2024", item.itemEntityId),
      });
    }
  }

  // --- Weapon mastery choices: attach to the class-level source payload ---
  if (character.weaponMasteries && character.weaponMasteries.length > 0) {
    const classSource = sources.find((s) => s.source.kind === "class-level");
    if (classSource) {
      classSource.source.payload = {
        ...classSource.source.payload,
        weaponMasteries: character.weaponMasteries.map((m) => ({
          weaponEntityId: m.weaponEntityId,
          masteryProperty: m.masteryProperty,
        })),
      };
    }
  }

  return {
    base,
    sources,
    xpLedger: character.xpLedger.map((entry) => ({
      id: entry.id,
      timestamp: "2026-01-01T00:00:00.000Z",
      amount: entry.amount,
      category: entry.category,
      note: entry.note,
      sessionId: entry.sessionId ?? undefined,
    })),
  };
}

/** Build fixtures for all reviewed characters at once. */
export function buildAllCharacterFixtures(
  roster: VerifiedRoster,
): Map<string, CharacterComputationInput> {
  const fixtures = new Map<string, CharacterComputationInput>();
  for (const character of roster.characters) {
    if (character.reviewStatus === "needs-review") continue;
    fixtures.set(character.identity.slug, buildCharacterFixture(roster, character.identity.slug));
  }
  return fixtures;
}

/** Slug list of the five seeded roster characters. */
export const rosterSlugs = [
  "nara",
  "oriana",
  "ronan-wildspark",
  "tali",
  "vivennah",
] as const;

export type RosterSlug = (typeof rosterSlugs)[number];
