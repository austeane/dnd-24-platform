---
{
  "type": "class-feature",
  "id": "class-feature:font-of-magic",
  "slug": "font-of-magic",
  "name": "Font of Magic",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-04:Sorcerer/Level 2: Font of Magic"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Gain Sorcery Points and convert between sorcery points and spell slots.",
  "classId": "class:sorcerer",
  "level": 2,
  "effects": [
    {
      "type": "grant-resource",
      "resource": {
        "name": "Sorcery Points",
        "maxUses": 2,
        "resetOn": "long"
      }
    },
    {
      "type": "grant-action",
      "action": {
        "name": "Create Spell Slot",
        "timing": "bonus-action",
        "description": "Spend Sorcery Points to create a spell slot allowed by your sorcerer level."
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Convert Spell Slot to Sorcery Points",
        "description": "You can expend a spell slot to gain Sorcery Points equal to the slot's level."
      }
    }
  ]
}
---
Font of Magic creates a sorcery-point pool and lets a sorcerer trade between points and spell slots. The amount of sorcery points scales by sorcerer level, but level 2 starts at 2 points.
