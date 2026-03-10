---
{
  "type": "spell",
  "id": "aa-spell-find-familiar",
  "slug": "find-familiar-aa",
  "name": "Find Familiar",
  "packId": "advanced-adventurers",
  "sourceEdition": "aa-2024-adapted",
  "sourceReference": {
    "sourceTitle": "Advanced Adventurers",
    "locator": "combined.md:image9:Pact of the Chain"
  },
  "adaptationMode": "ported-with-judgement",
  "judgement": {
    "isJudgementCall": true,
    "judgementBasis": "AA's Pact of the Chain assumes the 2014-style Find Familiar with special familiar forms (imp, pseudodragon, quasit, sprite) and the ability to forgo an attack for a familiar attack. This overlay keeps the 2024 SRD Find Familiar text as the baseline and carries the AA Pact of the Chain expanded familiar options as overlay metadata.",
    "derivedFrom": [
      {
        "label": "2024 SRD Find Familiar",
        "sourceEdition": "srd-2024",
        "sourceReference": {
          "sourceTitle": "System Reference Document 5.2.1",
          "locator": "chapter-08:Find Familiar"
        },
        "packId": "srd-5e-2024",
        "entityId": "spell-find-familiar"
      },
      {
        "label": "AA Pact of the Chain",
        "sourceEdition": "aa-2014",
        "sourceReference": {
          "sourceTitle": "Advanced Adventurers",
          "locator": "combined.md:image9:Pact of the Chain"
        }
      }
    ]
  },
  "reviewStatus": "llm-judgement",
  "summary": "AA universal-access overlay for Find Familiar using 2024 wording. Pact of the Chain enables special familiar forms and familiar attacks.",
  "tags": ["aa", "conjuration", "familiar"],
  "level": 1,
  "school": "Conjuration",
  "classes": [],
  "availability": "aa-universal",
  "castingTime": "1 hour",
  "ritual": true,
  "range": "10 feet",
  "components": {
    "verbal": true,
    "somatic": true,
    "material": "burning incense worth 10+ GP, which the spell consumes"
  },
  "duration": "Instantaneous",
  "concentration": false,
  "overlayTarget": {
    "packId": "srd-5e-2024",
    "entityId": "spell-find-familiar"
  },
  "aaSection": "Pact of the Chain",
  "linkedAaAbilityIds": ["aa-ability-pact-of-the-chain"],
  "interactionTypes": ["modifier"]
}
---
You gain the service of a familiar, a spirit that takes an animal form you choose. Appearing in an unoccupied space within range, the familiar has the statistics of the chosen form, though it is a Celestial, Fey, or Fiend (your choice) instead of a Beast.

With the Pact of the Chain ability, you can choose one of the following special forms in addition to normal options: imp, pseudodragon, quasit, or sprite. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its reaction.
