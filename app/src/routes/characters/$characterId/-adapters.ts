import type { CharacterShellData } from "../../../server/tavern/character-shell.ts";
import type { AbilityScoreCardProps } from "../../../components/tavern/character/AbilityScoreCard.tsx";
import type { CharacterCardProps } from "../../../components/tavern/character/CharacterCard.tsx";
import type { CombatPanelProps } from "../../../components/tavern/character/CombatPanel.tsx";
import type { FeatureEntry } from "../../../components/tavern/character/FeaturesPanel.tsx";
import type { SkillEntry } from "../../../components/tavern/character/SkillsPanel.tsx";
import type { XPProgressBarProps } from "../../../components/tavern/character/XPProgressBar.tsx";

const ABILITY_ABBREVIATIONS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

const ABILITY_ORDER = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function extractFromSources(
  sources: Array<{ source: { kind: string; name: string } }>,
  kind: string,
): string | undefined {
  const match = sources.find((s) => s.source.kind === kind);
  return match?.source.name;
}

export function toCharacterCardProps(data: CharacterShellData): CharacterCardProps {
  const runtime = data.runtime;
  const classLabel = extractFromSources(runtime.sources, "class-level") ?? "Adventurer";
  const backgroundLabel = extractFromSources(runtime.sources, "background") ?? "";
  const speciesLabel = extractFromSources(runtime.sources, "species") ?? "Unknown";

  // Extract base class name from label like "Fighter 5"
  const classNameOnly = classLabel.replace(/\s+\d+$/, "");

  const subtitle = backgroundLabel
    ? `${classLabel} \u00B7 ${backgroundLabel}`
    : classLabel;

  return {
    name: runtime.name,
    subtitle,
    level: runtime.level,
    className: classNameOnly,
    species: speciesLabel,
  };
}

export function toAbilityScoreProps(
  data: CharacterShellData,
): AbilityScoreCardProps[] {
  const scores = data.runtime.abilityScores;
  const primaryAbility = data.runtime.spellcasting?.ability;

  return ABILITY_ORDER.map((ability) => ({
    name: ability,
    abbreviation: ABILITY_ABBREVIATIONS[ability] ?? ability.slice(0, 3).toUpperCase(),
    score: scores[ability],
    modifier: abilityModifier(scores[ability]),
    isPrimary: ability === primaryAbility,
  }));
}

export function toCombatPanelProps(data: CharacterShellData): CombatPanelProps {
  const runtime = data.runtime;

  // Build a simple AC breakdown string from the explanation
  const acContributors = runtime.acBreakdown.explanation.contributors
    .map((c) => `${c.sourceName} ${c.value >= 0 ? "+" : ""}${c.value}`)
    .join(", ");

  return {
    maxHp: runtime.maxHP,
    armorClass: runtime.armorClass.total,
    acBreakdown: acContributors || `Base ${runtime.armorClass.total}`,
    initiative: runtime.initiative.total,
    speed: runtime.speed,
    spellSaveDc: runtime.spellcasting?.spellSaveDc,
    proficiencyBonus: runtime.proficiencyBonus,
  };
}

export function toSkillsPanelProps(
  data: CharacterShellData,
): { skills: SkillEntry[] } {
  return {
    skills: data.runtime.skillState.skills.map((skill) => ({
      name: skill.skillName,
      bonus: skill.bonus,
      proficient: skill.proficient,
      expertise: skill.expertise,
    })),
  };
}

export function toFeaturesPanelProps(
  data: CharacterShellData,
): { features: FeatureEntry[] } {
  return {
    features: data.runtime.traits.map((trait) => ({
      name: trait.name,
      origin: trait.sourceName,
    })),
  };
}

export function toXPBarProps(data: CharacterShellData): XPProgressBarProps {
  const xp = data.runtime.xp;
  return {
    totalEarned: xp.totalEarned,
    totalSpent: xp.totalSpent,
    banked: xp.banked,
    progressionMode: data.campaign.progressionMode,
  };
}
