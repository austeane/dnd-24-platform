/**
 * Live-roster snapshot script.
 *
 * Reads the verified-characters.json intake file, builds CharacterComputationInput
 * for each character using the same canonical lookup pipeline the seed uses, runs
 * computeCharacterState, and writes a deterministic JSON snapshot.
 *
 * Usage:
 *   pnpm snapshot:live-roster                  # write snapshot + compare baseline
 *   pnpm snapshot:live-roster --update         # overwrite baseline with current
 *   pnpm snapshot:live-roster --check          # exit non-zero if drift detected
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCharacterState,
  getCanonicalEffectsForSource,
  getCanonicalSpellByName,
  normalizeCanonicalEntityId,
  type CharacterBaseSnapshot,
  type CharacterComputationInput,
  type CharacterState,
  type Effect,
  type PackId,
  type SourceWithEffects,
} from "../library/src/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const intakePath = path.join(rootDir, "data", "real-campaign-intake", "verified-characters.json");
const snapshotDir = path.join(rootDir, "data", "fleet", "snapshots");
const baselinePath = path.join(snapshotDir, "live-roster-baseline.json");
const latestPath = path.join(snapshotDir, "live-roster-latest.json");

// --- Character input building (mirrors seed-real-campaign.ts logic, no DB) ---

interface SkillChoiceData {
  skillName: string;
  source: string;
  sourceLabel: string;
  hasExpertise?: boolean;
}

interface FeatChoiceData {
  featEntityId: string;
  featPackId?: string | null;
  featLabel: string;
  subChoicesJson?: Record<string, unknown> | null;
  sourceLabel: string;
}

interface EquipmentData {
  itemEntityId: string;
  itemPackId?: string | null;
  itemLabel: string;
  quantity: number;
  equipped: boolean;
  slot?: string | null;
}

interface WeaponMasteryData {
  weaponEntityId: string;
  weaponPackId?: string | null;
  weaponLabel: string;
  masteryProperty: string;
}

interface MetamagicChoiceData {
  metamagicOption: string;
  sourceLabel: string;
}

interface PactBladeBondData {
  weaponEntityId?: string | null;
  weaponPackId?: string | null;
  weaponLabel: string;
  isMagicWeapon: boolean;
}

interface VerifiedCharacter {
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
  notes: string[];
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

interface VerifiedCampaign {
  campaign: {
    progressionMode: "standard" | "aa-only" | "hybrid";
    enabledPackIds: string[];
  };
  characters: VerifiedCharacter[];
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

function buildSeedFeatures(character: VerifiedCharacter): SeedFeature[] {
  const merged = new Map<string, SeedFeature>();

  for (const blueprint of defaultClassFeatureIds[character.identity.classId] ?? []) {
    if (character.identity.level < blueprint.minLevel) continue;
    const key = `class-feature:${normalizeCanonicalEntityId(blueprint.entityId) ?? blueprint.entityId}:1`;
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

function buildComputationInput(
  progressionMode: "standard" | "aa-only" | "hybrid",
  enabledPackIds: PackId[],
  character: VerifiedCharacter,
): CharacterComputationInput {
  const seedFeatures = buildSeedFeatures(character);

  // Derive walk speed bonus from canonical effects (same logic as seed script)
  const derivedWalkSpeedBonus = seedFeatures.reduce((sum, feature) => {
    const canonical = getCanonicalEffectsForSource(
      feature.sourcePackId ?? undefined,
      feature.sourceEntityId,
    );
    const combined = [...canonical, ...feature.effects];
    return sum + combined.reduce((inner, effect) => {
      if (effect.type !== "speed-bonus" || effect.movementType !== "walk") return inner;
      return inner + effect.value;
    }, 0);
  }, 0);

  const base: CharacterBaseSnapshot = {
    name: character.identity.name,
    progressionMode,
    abilityScores: character.abilities,
    baseArmorClass: character.tableState.armorClass,
    baseMaxHP: character.tableState.maxHp,
    baseSpeed: Math.max(character.tableState.speed - derivedWalkSpeedBonus, 0),
    basePassivePerception: character.tableState.passivePerception,
    spellcastingAbility: character.spellcasting?.ability,
  };

  const sources: SourceWithEffects[] = [];

  // Class level source
  sources.push({
    source: {
      id: `seed:${character.identity.slug}:class:${character.identity.classId}`,
      kind: "class-level",
      name: `${character.identity.className} ${character.identity.level}`,
      rank: character.identity.level,
    },
    effects: [],
  });

  // Spell list source
  if (character.spellcasting && character.spellcasting.knownSpells.length > 0) {
    sources.push({
      source: {
        id: `seed:${character.identity.slug}:feature:spell-list`,
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

  // Feature sources
  for (const feature of seedFeatures) {
    const canonical = getCanonicalEffectsForSource(
      feature.sourcePackId ?? undefined,
      feature.sourceEntityId,
    );
    const payload: Record<string, unknown> = {};

    if (feature.sourceKind === "feat" && character.featChoices) {
      const matchingFeat = character.featChoices.find(
        (fc) => fc.featEntityId === feature.sourceEntityId,
      );
      if (matchingFeat?.subChoicesJson) {
        payload["subChoicesJson"] = matchingFeat.subChoicesJson;
      }
    }
    if (feature.sourceEntityId === "class-feature:metamagic" && character.metamagicChoices) {
      payload["metamagicChoices"] = character.metamagicChoices.map((m) => m.metamagicOption);
    }
    if (feature.sourceEntityId === "class-feature:pact-of-the-blade" && character.pactBladeBond) {
      payload["pactBladeBond"] = {
        weaponLabel: character.pactBladeBond.weaponLabel,
        weaponEntityId: character.pactBladeBond.weaponEntityId ?? undefined,
        isMagicWeapon: character.pactBladeBond.isMagicWeapon,
      };
    }

    sources.push({
      source: {
        id: `seed:${character.identity.slug}:feature:${feature.id}`,
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

  // Skill choices -> proficiency effects
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
        id: `seed:${character.identity.slug}:skill-choices`,
        kind: "override",
        name: "Skill Proficiencies",
      },
      effects: skillEffects,
    });
  }

  // Equipment: only equipped weapons for attack profiles (armor AC is in baseArmorClass)
  if (character.equipment && character.equipment.length > 0) {
    for (const item of character.equipment) {
      if (!item.equipped) continue;
      if (item.slot === "armor" || item.slot === "off-hand") continue;
      sources.push({
        source: {
          id: `seed:${character.identity.slug}:equip:${item.itemEntityId}`,
          kind: "equipment",
          name: item.itemLabel,
          entityId: item.itemEntityId,
        },
        effects: getCanonicalEffectsForSource("srd-5e-2024", item.itemEntityId),
      });
    }
  }

  // Weapon mastery choices -> attach to class-level source
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

/** Deterministic snapshot shape for a single character */
interface CharacterSnapshot {
  slug: string;
  name: string;
  level: number;
  proficiencyBonus: number;
  armorClass: number;
  maxHP: number;
  initiative: number;
  speed: number;
  passivePerception: number;
  spellAttackBonus: number | null;
  spellSaveDc: number | null;
  spellCount: number;
  slotPools: Array<{ source: string; resetOn: string; slots: Array<{ level: number; total: number }> }>;
  attackProfileNames: string[];
  actionNames: string[];
  resourceNames: string[];
  traitNames: string[];
  senseNames: string[];
  proficientSkillNames: string[];
  proficiencies: {
    savingThrows: string[];
    skills: string[];
    weapons: string[];
    armors: string[];
    tools: string[];
    languages: string[];
  };
  resistances: string[];
  immunities: string[];
  noteCount: number;
  xpBanked: number;
}

function snapshotFromState(slug: string, state: CharacterState): CharacterSnapshot {
  return {
    slug,
    name: state.name,
    level: state.level,
    proficiencyBonus: state.proficiencyBonus,
    armorClass: state.armorClass.total,
    maxHP: state.maxHP,
    initiative: state.initiative.total,
    speed: state.speed,
    passivePerception: state.passivePerception.total,
    spellAttackBonus: state.spellcasting?.spellAttackBonus ?? null,
    spellSaveDc: state.spellcasting?.spellSaveDc ?? null,
    spellCount: state.spellcasting?.grantedSpellNames.length ?? 0,
    slotPools: (state.spellcasting?.slotPools ?? []).map((pool) => ({
      source: pool.source,
      resetOn: pool.resetOn,
      slots: pool.slots,
    })),
    attackProfileNames: state.attackProfiles.map((ap) => ap.name).sort(),
    actionNames: state.actions.map((action) => action.name).sort(),
    resourceNames: state.resources.map((resource) => resource.name).sort(),
    traitNames: state.traits.map((trait) => trait.name).sort(),
    senseNames: state.senses.map((sense) => `${sense.sense} ${sense.range}ft`).sort(),
    proficientSkillNames: state.skillState.skills
      .filter((s) => s.proficient)
      .map((s) => s.skillName)
      .sort(),
    proficiencies: {
      savingThrows: [...state.proficiencies.savingThrows].sort(),
      skills: [...state.proficiencies.skills].sort(),
      weapons: [...state.proficiencies.weapons].sort(),
      armors: [...state.proficiencies.armors].sort(),
      tools: [...state.proficiencies.tools].sort(),
      languages: [...state.proficiencies.languages].sort(),
    },
    resistances: state.resistances.map((r) => r.condition ? `${r.damageType} (${r.condition})` : r.damageType).sort(),
    immunities: [...state.immunities].sort(),
    noteCount: state.notes.length,
    xpBanked: state.xp.banked,
  };
}

interface RosterSnapshot {
  generatedAt: string;
  engineVersion: string;
  characterCount: number;
  characters: CharacterSnapshot[];
}

async function buildSnapshot(): Promise<RosterSnapshot> {
  const { ENGINE_VERSION } = await import("../library/src/engine/index.ts");
  const raw = await readFile(intakePath, "utf8");
  const data = JSON.parse(raw) as VerifiedCampaign;
  const enabledPackIds = data.campaign.enabledPackIds as PackId[];

  const characters: CharacterSnapshot[] = [];

  for (const character of data.characters) {
    if (character.reviewStatus === "needs-review") continue;

    const input = buildComputationInput(
      data.campaign.progressionMode,
      enabledPackIds,
      character,
    );
    const state = computeCharacterState(input);
    characters.push(snapshotFromState(character.identity.slug, state));
  }

  // Sort by slug for determinism
  characters.sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    characterCount: characters.length,
    characters,
  };
}

function stripTimestamp(snapshot: RosterSnapshot): Omit<RosterSnapshot, "generatedAt"> {
  const { generatedAt: _, ...rest } = snapshot;
  return rest;
}

interface DiffEntry {
  slug: string;
  field: string;
  baseline: unknown;
  current: unknown;
}

function diffSnapshots(
  baseline: RosterSnapshot,
  current: RosterSnapshot,
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  if (baseline.engineVersion !== current.engineVersion) {
    diffs.push({ slug: "*", field: "engineVersion", baseline: baseline.engineVersion, current: current.engineVersion });
  }

  if (baseline.characterCount !== current.characterCount) {
    diffs.push({ slug: "*", field: "characterCount", baseline: baseline.characterCount, current: current.characterCount });
  }

  const baselineBySlug = new Map(baseline.characters.map((c) => [c.slug, c]));
  const currentBySlug = new Map(current.characters.map((c) => [c.slug, c]));

  for (const [slug, currentChar] of currentBySlug) {
    const baselineChar = baselineBySlug.get(slug);
    if (!baselineChar) {
      diffs.push({ slug, field: "(new character)", baseline: undefined, current: currentChar.name });
      continue;
    }

    for (const key of Object.keys(currentChar) as Array<keyof CharacterSnapshot>) {
      const baseVal = JSON.stringify(baselineChar[key]);
      const currVal = JSON.stringify(currentChar[key]);
      if (baseVal !== currVal) {
        diffs.push({ slug, field: key, baseline: baselineChar[key], current: currentChar[key] });
      }
    }
  }

  for (const slug of baselineBySlug.keys()) {
    if (!currentBySlug.has(slug)) {
      diffs.push({ slug, field: "(removed character)", baseline: slug, current: undefined });
    }
  }

  return diffs;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const isCheck = args.includes("--check");

  await mkdir(snapshotDir, { recursive: true });

  const snapshot = await buildSnapshot();
  await writeFile(latestPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  process.stdout.write(`Wrote ${latestPath} (${snapshot.characterCount} characters)\n`);

  // Print summary
  for (const character of snapshot.characters) {
    process.stdout.write(
      `  ${character.name}: L${character.level} AC${character.armorClass} HP${character.maxHP} Init+${character.initiative} PP${character.passivePerception}\n`,
    );
  }

  if (isUpdate) {
    await writeFile(baselinePath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
    process.stdout.write(`Updated baseline at ${baselinePath}\n`);
    return;
  }

  // Compare against baseline if it exists
  let baseline: RosterSnapshot | undefined;
  try {
    const raw = await readFile(baselinePath, "utf8");
    baseline = JSON.parse(raw) as RosterSnapshot;
  } catch {
    process.stdout.write(`No baseline found at ${baselinePath}. Run with --update to create one.\n`);
    return;
  }

  const diffs = diffSnapshots(
    { ...baseline, ...stripTimestamp(baseline) },
    { ...snapshot, ...stripTimestamp(snapshot) },
  );

  if (diffs.length === 0) {
    process.stdout.write("No drift from baseline.\n");
    return;
  }

  process.stdout.write(`\nDrift detected (${diffs.length} change${diffs.length === 1 ? "" : "s"}):\n`);
  for (const diff of diffs) {
    process.stdout.write(
      `  [${diff.slug}] ${diff.field}: ${JSON.stringify(diff.baseline)} -> ${JSON.stringify(diff.current)}\n`,
    );
  }

  if (isCheck) {
    process.exitCode = 1;
  }
}

await main();
