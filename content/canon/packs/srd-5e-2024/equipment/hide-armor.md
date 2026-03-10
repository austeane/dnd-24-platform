---
{
  "type": "equipment",
  "id": "equipment:hide-armor",
  "slug": "hide-armor",
  "name": "Hide Armor",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-07:Equipment/Hide Armor"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Medium armor with AC 12 + Dex modifier (max 2).",
  "equipmentCategory": "armor",
  "effects": [
    {
      "type": "set-ac-formula",
      "formula": {
        "base": 12,
        "abilityModifiers": ["dexterity"],
        "maxAC": 14
      }
    }
  ]
}
---
Hide Armor sets AC to 12 plus Dexterity modifier, capped at +2.
