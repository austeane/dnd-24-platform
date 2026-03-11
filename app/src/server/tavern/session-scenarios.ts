import type { TavernSessionScenario } from "./types.ts";

export const taliLevelUpScenario: TavernSessionScenario = {
  id: "tali-druid-3-session",
  campaignSlug: "real-aa-campaign",
  characterSlug: "tali",
  session: {
    title: "Session 1: Hex at the Hollow",
    sessionNumber: 1,
  },
  communication: {
    kind: "rule-callout",
    title: "Spell notes for tonight",
    summary: "Hex and Entangle came up in play.",
    bodyMd:
      "Hex from Advanced Adventurers and Entangle from the SRD both came up in play.\n\nKeep the concentration overlap in mind before committing to a longer effect.",
    refs: [
      {
        refType: "spell",
        refPackId: "advanced-adventurers",
        refId: "aa-spell-hex",
      },
      {
        refType: "spell",
        refPackId: "srd-5e-2024",
        refId: "spell-entangle",
      },
    ],
  },
  xpAward: {
    amount: 5,
    note: "Session 1 XP award",
  },
  spendPlan: {
    summary: "Tali reaches Druid 3",
    notes: "Session scenario level-up",
    planJson: {
      version: 1,
      operations: [
        {
          type: "class-level",
          classEntityId: "class:druid",
          classPackId: "srd-5e-2024",
          levelsGranted: 1,
          xpCost: 5,
        },
      ],
    },
  },
};
