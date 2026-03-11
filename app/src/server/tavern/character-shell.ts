import { getTavernCharacterContext } from "./context.ts";
import { buildInventoryRuntimeData } from "./inventory.ts";
import { buildSpellbookData } from "./spellbook.ts";
import type { CharacterRuntimeState } from "../progression/types.ts";
import type { TavernShellData } from "./types.ts";

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function extractSourceLabel(
  sources: Array<{ source: { kind: string; name: string } }>,
  kind: string,
): string | undefined {
  return sources.find((source) => source.source.kind === kind)?.source.name;
}

function buildSummary(
  runtime: CharacterRuntimeState,
): TavernShellData["summary"] {
  const abilityOrder = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ] as const;
  const classLabel = extractSourceLabel(runtime.sources, "class-level") ?? "Adventurer";
  const backgroundLabel = extractSourceLabel(runtime.sources, "background") ?? "";
  const speciesLabel = extractSourceLabel(runtime.sources, "species") ?? "Unknown";
  const acBreakdown = runtime.acBreakdown.explanation.contributors
    .map((contributor) => (
      `${contributor.sourceName} ${contributor.value >= 0 ? "+" : ""}${contributor.value}`
    ))
    .join(", ");

  return {
    subtitle: backgroundLabel ? `${classLabel} \u00B7 ${backgroundLabel}` : classLabel,
    className: classLabel.replace(/\s+\d+$/, ""),
    species: speciesLabel,
    level: runtime.level,
    abilityScores: abilityOrder.map((ability) => ({
      name: ability,
      score: runtime.abilityScores[ability],
      modifier: abilityModifier(runtime.abilityScores[ability]),
      isPrimary: ability === runtime.spellcasting?.ability,
    })),
    combat: {
      maxHp: runtime.maxHP,
      currentHp: runtime.currentHP,
      tempHp: runtime.tempHP,
      armorClass: runtime.armorClass.total,
      acBreakdown: acBreakdown || `Base ${runtime.armorClass.total}`,
      initiative: runtime.initiative.total,
      speed: runtime.speed,
      spellSaveDc: runtime.spellcasting?.spellSaveDc ?? null,
      proficiencyBonus: runtime.proficiencyBonus,
    },
    skills: runtime.skillState.skills.map((skill) => ({
      name: skill.skillName,
      bonus: skill.bonus,
      proficient: skill.proficient,
      expertise: skill.expertise,
    })),
    features: runtime.traits.map((trait) => ({
      name: trait.name,
      origin: trait.sourceName,
    })),
    xp: {
      totalEarned: runtime.xp.totalEarned,
      totalSpent: runtime.xp.totalSpent,
      banked: runtime.xp.banked,
    },
  };
}

export function buildCharacterShellData(
  context: NonNullable<Awaited<ReturnType<typeof getTavernCharacterContext>>>,
): TavernShellData {
  if (!context.runtime) {
    throw new Error("Tavern shell data requires runtime state.");
  }

  return {
    campaign: context.campaign,
    character: context.character,
    summary: buildSummary(context.runtime),
    spellbook: buildSpellbookData(
      context.runtime.spellcasting,
      context.campaign.enabledPackIds,
    ),
    inventoryRuntime: buildInventoryRuntimeData(context.runtime),
  };
}

export async function getCharacterShellData(
  characterId: string,
): Promise<TavernShellData | null> {
  const context = await getTavernCharacterContext(characterId);
  if (!context?.runtime) {
    return null;
  }

  return buildCharacterShellData(context);
}
