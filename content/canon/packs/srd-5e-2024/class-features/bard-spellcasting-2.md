---
{
  "type": "class-feature",
  "id": "class-feature-bard-spellcasting-2",
  "slug": "bard-spellcasting-2",
  "name": "Bard Spellcasting (Level 2)",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-03:Bard/Spellcasting"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "reviewed",
  "summary": "Level-2 bard spell slot progression.",
  "classId": "class-bard",
  "level": 2,
  "effects": [
    {
      "type": "grant-spell-slots",
      "pool": {
        "slots": [3],
        "resetOn": "long",
        "source": "Spellcasting"
      }
    }
  ]
}
---
The slot pool is modeled separately from specific spell access so the same runtime can later support prepared, learned, and campaign-granted spells.
