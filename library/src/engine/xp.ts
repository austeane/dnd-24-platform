import type { CharacterState, XPLedgerEntry } from "../types/character.ts";

export function buildXpSummary(entries: XPLedgerEntry[]): CharacterState["xp"] {
  let totalAwarded = 0;
  let totalSpentOnAA = 0;
  let totalSpentOnLevels = 0;
  let totalRefunded = 0;
  let totalAdjusted = 0;

  for (const entry of entries) {
    switch (entry.category) {
      case "award":
        totalAwarded += entry.amount;
        break;
      case "spend-aa":
        totalSpentOnAA += entry.amount;
        break;
      case "spend-level":
        totalSpentOnLevels += entry.amount;
        break;
      case "refund":
        totalRefunded += entry.amount;
        break;
      case "adjustment":
        totalAdjusted += entry.amount;
        break;
    }
  }

  return {
    totalEarned: totalAwarded,
    totalSpent: totalSpentOnAA + totalSpentOnLevels,
    totalSpentOnLevels,
    totalSpentOnAA,
    totalRefunded,
    totalAdjusted,
    banked: totalAwarded + totalRefunded + totalAdjusted - totalSpentOnAA - totalSpentOnLevels,
    entries: [...entries].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
  };
}
