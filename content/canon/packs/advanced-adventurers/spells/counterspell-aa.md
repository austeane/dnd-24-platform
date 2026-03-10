---
{
  "type": "spell",
  "id": "aa-spell-counterspell",
  "slug": "counterspell-aa",
  "name": "Counterspell",
  "packId": "advanced-adventurers",
  "sourceEdition": "aa-2024-adapted",
  "sourceReference": {
    "sourceTitle": "Advanced Adventurers",
    "locator": "combined.md:image3:Improved Abjuration; image18:Spell Stealer"
  },
  "adaptationMode": "ported-with-judgement",
  "judgement": {
    "isJudgementCall": true,
    "judgementBasis": "AA's Improved Abjuration and Spell Stealer assume the older ability-check-driven Counterspell flow. This overlay preserves the 2024 Constitution-save spell text while flagging the AA interaction hooks for later runtime reinterpretation rather than text replacement.",
    "derivedFrom": [
      {
        "label": "2024 SRD Counterspell",
        "sourceEdition": "srd-2024",
        "sourceReference": {
          "sourceTitle": "System Reference Document 5.2.1",
          "locator": "chapter-08:Counterspell"
        },
        "packId": "srd-5e-2024",
        "entityId": "spell-counterspell"
      },
      {
        "label": "AA Improved Abjuration and Spell Stealer",
        "sourceEdition": "aa-2014",
        "sourceReference": {
          "sourceTitle": "Advanced Adventurers",
          "locator": "combined.md:image3:Improved Abjuration; image18:Spell Stealer"
        }
      }
    ]
  },
  "reviewStatus": "llm-judgement",
  "summary": "AA universal-access overlay for Counterspell using 2024 wording and explicit judgement metadata for the AA abjuration interaction model.",
  "tags": ["aa", "abjuration", "reaction"],
  "level": 3,
  "school": "Abjuration",
  "classes": [],
  "availability": "aa-universal",
  "castingTime": "Reaction, which you take when you see a creature within 60 feet of yourself casting a spell with Verbal, Somatic, or Material components",
  "ritual": false,
  "range": "60 feet",
  "components": {
    "verbal": false,
    "somatic": true
  },
  "duration": "Instantaneous",
  "concentration": false,
  "overlayTarget": {
    "packId": "srd-5e-2024",
    "entityId": "spell-counterspell"
  },
  "aaSection": "Improved Abjuration; Spell Stealer",
  "linkedAaAbilityIds": ["aa-ability-improved-abjuration", "aa-ability-spell-stealer"],
  "interactionTypes": ["modifier"]
}
---
You attempt to interrupt a creature in the process of casting a spell. The creature makes a Constitution saving throw. On a failed save, the spell dissipates with no effect, and the action, Bonus Action, or Reaction used to cast it is wasted. If that spell was cast with a spell slot, the slot isn't expended.
