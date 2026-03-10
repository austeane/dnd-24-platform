export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonusForLevel(level: number): number {
  if (level <= 0) {
    return 0;
  }

  return Math.floor((level - 1) / 4) + 2;
}
