import type { AbilityScoreCardProps } from "../../../components/tavern/character/AbilityScoreCard.tsx";
import type { CharacterCardProps } from "../../../components/tavern/character/CharacterCard.tsx";
import type { CombatPanelProps } from "../../../components/tavern/character/CombatPanel.tsx";
import type { FeatureEntry } from "../../../components/tavern/character/FeaturesPanel.tsx";
import type { SkillEntry } from "../../../components/tavern/character/SkillsPanel.tsx";
import type { XPProgressBarProps } from "../../../components/tavern/character/XPProgressBar.tsx";
import type { TavernShellData } from "./-server.ts";

const ABILITY_ABBREVIATIONS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export function toCharacterCardProps(data: TavernShellData): CharacterCardProps {
  return {
    name: data.character.name,
    subtitle: data.summary.subtitle,
    level: data.summary.level,
    className: data.summary.className,
    species: data.summary.species,
  };
}

export function toAbilityScoreProps(
  data: TavernShellData,
): AbilityScoreCardProps[] {
  return data.summary.abilityScores.map((ability) => ({
    name: ability.name,
    abbreviation:
      ABILITY_ABBREVIATIONS[ability.name] ??
      ability.name.slice(0, 3).toUpperCase(),
    score: ability.score,
    modifier: ability.modifier,
    isPrimary: ability.isPrimary,
  }));
}

export function toCombatPanelProps(data: TavernShellData): CombatPanelProps {
  return {
    maxHp: data.summary.combat.maxHp,
    armorClass: data.summary.combat.armorClass,
    acBreakdown: data.summary.combat.acBreakdown,
    initiative: data.summary.combat.initiative,
    speed: data.summary.combat.speed,
    spellSaveDc: data.summary.combat.spellSaveDc ?? undefined,
    proficiencyBonus: data.summary.combat.proficiencyBonus,
  };
}

export function toSkillsPanelProps(
  data: TavernShellData,
): { skills: SkillEntry[] } {
  return {
    skills: data.summary.skills.map((skill) => ({
      name: skill.name,
      bonus: skill.bonus,
      proficient: skill.proficient,
      expertise: skill.expertise,
    })),
  };
}

export function toFeaturesPanelProps(
  data: TavernShellData,
): { features: FeatureEntry[] } {
  return {
    features: data.summary.features.map((feature) => ({
      name: feature.name,
      origin: feature.origin,
    })),
  };
}

export function toXPBarProps(data: TavernShellData): XPProgressBarProps {
  return {
    totalEarned: data.summary.xp.totalEarned,
    totalSpent: data.summary.xp.totalSpent,
    banked: data.summary.xp.banked,
    progressionMode: data.campaign.progressionMode,
  };
}
