---
{
  "type": "class-feature",
  "id": "class-feature:wild-shape",
  "slug": "wild-shape",
  "name": "Wild Shape",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-04:Druid/Level 2: Wild Shape"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Use a bonus action to shape-shift into a known beast form, with two uses at level 2.",
  "classId": "class:druid",
  "level": 2,
  "effects": [
    {
      "type": "grant-action",
      "action": {
        "name": "Wild Shape",
        "timing": "bonus-action",
        "description": "Shape-shift into a known beast form for up to half your druid level in hours."
      }
    },
    {
      "type": "grant-resource",
      "resource": {
        "name": "Wild Shape",
        "maxUses": 2,
        "resetOn": "short"
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Wild Shape Forms",
        "description": "At level 2 you know four CR 1/4 beast forms without a fly speed and gain temporary hit points equal to your druid level when you transform."
      }
    }
  ]
}
---
Wild Shape lets a druid assume known beast forms as a bonus action. The feature carries its own use pool, known-form limits, and shape-shift rules.
