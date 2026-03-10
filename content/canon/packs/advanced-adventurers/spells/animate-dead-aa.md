---
{
  "type": "spell",
  "id": "aa-spell-animate-dead",
  "slug": "animate-dead-aa",
  "name": "Animate Dead",
  "packId": "advanced-adventurers",
  "sourceEdition": "aa-2024-adapted",
  "sourceReference": {
    "sourceTitle": "Advanced Adventurers",
    "locator": "combined.md:image20:Undead Thralls"
  },
  "adaptationMode": "ported-with-judgement",
  "judgement": {
    "isJudgementCall": true,
    "judgementBasis": "AA's Undead Thralls assumes the 2014-style Animate Dead control model. This overlay keeps the 2024 SRD Animate Dead wording as the canonical baseline and carries the AA undead-scaling intent as explicit overlay metadata for later runtime support.",
    "derivedFrom": [
      {
        "label": "2024 SRD Animate Dead",
        "sourceEdition": "srd-2024",
        "sourceReference": {
          "sourceTitle": "System Reference Document 5.2.1",
          "locator": "chapter-08:Animate Dead"
        },
        "packId": "srd-5e-2024",
        "entityId": "spell-animate-dead"
      },
      {
        "label": "AA Undead Thralls",
        "sourceEdition": "aa-2014",
        "sourceReference": {
          "sourceTitle": "Advanced Adventurers",
          "locator": "combined.md:image20:Undead Thralls"
        }
      }
    ]
  },
  "reviewStatus": "llm-judgement",
  "summary": "AA universal-access overlay for Animate Dead using 2024 wording and explicit judgement-call provenance for the Undead Thralls upgrade path.",
  "tags": ["aa", "necromancy", "undead"],
  "level": 3,
  "school": "Necromancy",
  "classes": [],
  "availability": "aa-universal",
  "castingTime": "1 minute",
  "ritual": false,
  "range": "10 feet",
  "components": {
    "verbal": true,
    "somatic": true,
    "material": "a drop of blood, a piece of flesh, and a pinch of bone dust"
  },
  "duration": "Instantaneous",
  "concentration": false,
  "higherLevelsLabel": "Using a Higher-Level Spell Slot",
  "higherLevelsMd": "You animate or reassert control over two additional Undead creatures for each spell slot level above 3.",
  "overlayTarget": {
    "packId": "srd-5e-2024",
    "entityId": "spell-animate-dead"
  },
  "aaSection": "Undead Thralls",
  "linkedAaAbilityIds": ["aa-ability-undead-thralls"],
  "interactionTypes": ["modifier"]
}
---
Choose a pile of bones or a corpse of a Medium or Small Humanoid within range. The target becomes an Undead creature: a **Skeleton** if you chose bones or a **Zombie** if you chose a corpse.

On each of your turns, you can take a Bonus Action to mentally command any creature you made with this spell if the creature is within 60 feet of you. If you control multiple creatures, you can command any of them at the same time, issuing the same command to each one. If you issue no commands, the creature takes the Dodge action and moves only to avoid harm.

The creature is under your control for 24 hours. To maintain control of the creature for another 24 hours, you must cast this spell on the creature again before the current period ends.
