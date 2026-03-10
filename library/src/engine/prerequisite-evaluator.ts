import type {
  AbilityName,
  CharacterState,
  PrerequisiteCheck,
  PrerequisiteEvaluation,
} from "../types/character.ts";
import type { AAPrerequisite } from "../types/aa-ability.ts";

const abilityAliases: Record<string, AbilityName> = {
  str: "strength",
  strength: "strength",
  dex: "dexterity",
  dexterity: "dexterity",
  con: "constitution",
  constitution: "constitution",
  int: "intelligence",
  intelligence: "intelligence",
  wis: "wisdom",
  wisdom: "wisdom",
  cha: "charisma",
  charisma: "charisma",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseAbilityScoreRequirement(value: string): {
  ability: AbilityName;
  minimum: number;
} | null {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d+)$/);
  if (!match) {
    return null;
  }

  const [, rawAbility, rawMinimum] = match;
  if (!rawAbility || !rawMinimum) {
    return null;
  }

  const ability = abilityAliases[normalize(rawAbility)];
  if (!ability) {
    return null;
  }

  return {
    ability,
    minimum: Number(rawMinimum),
  };
}

function parseLevelRequirement(value: string): number | null {
  const match = value.trim().match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function evaluatePrerequisite(
  prerequisite: AAPrerequisite,
  state: CharacterState,
): PrerequisiteCheck {
  switch (prerequisite.type) {
    case "ability": {
      const needle = normalize(prerequisite.value);
      const sourceMatch = state.sources.some((entry) =>
        normalize(entry.source.name).includes(needle) ||
        normalize(entry.source.id).includes(needle) ||
        normalize(entry.source.entityId ?? "").includes(needle)
      );

      return {
        prerequisite,
        passed: sourceMatch,
        reason: sourceMatch
          ? `Found source matching "${prerequisite.value}".`
          : `No source matched "${prerequisite.value}".`,
      };
    }
    case "ability-score": {
      const requirement = parseAbilityScoreRequirement(prerequisite.value);
      if (!requirement) {
        return {
          prerequisite,
          passed: false,
          reason: `Could not parse ability-score prerequisite "${prerequisite.value}".`,
        };
      }

      const actual = state.abilityScores[requirement.ability];
      return {
        prerequisite,
        passed: actual >= requirement.minimum,
        reason: `${requirement.ability} ${actual}/${requirement.minimum}`,
      };
    }
    case "level": {
      const minimum = parseLevelRequirement(prerequisite.value);
      if (minimum == null) {
        return {
          prerequisite,
          passed: false,
          reason: `Could not parse level prerequisite "${prerequisite.value}".`,
        };
      }

      return {
        prerequisite,
        passed: state.level >= minimum,
        reason: `Level ${state.level}/${minimum}`,
      };
    }
    case "proficiency": {
      const needle = normalize(prerequisite.value);
      const values = [
        ...state.proficiencies.savingThrows,
        ...state.proficiencies.skills,
        ...state.proficiencies.weapons,
        ...state.proficiencies.armors,
        ...state.proficiencies.tools,
        ...state.proficiencies.languages,
      ];
      const passed = values.some((value) => normalize(value) === needle);

      return {
        prerequisite,
        passed,
        reason: passed
          ? `Found proficiency "${prerequisite.value}".`
          : `Missing proficiency "${prerequisite.value}".`,
      };
    }
    case "spellcasting": {
      const passed = state.spellcasting !== null;
      return {
        prerequisite,
        passed,
        reason: passed
          ? "Character has spellcasting capability."
          : "Character has no spellcasting capability.",
      };
    }
  }
}

export function evaluatePrerequisites(
  prerequisites: AAPrerequisite[],
  state: CharacterState,
): PrerequisiteEvaluation {
  const checks = prerequisites.map((prerequisite) =>
    evaluatePrerequisite(prerequisite, state)
  );

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}
