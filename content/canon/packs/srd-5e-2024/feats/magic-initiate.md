---
{
  "type": "feat",
  "id": "feat:magic-initiate",
  "slug": "magic-initiate",
  "name": "Magic Initiate",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-06:Feats/Magic Initiate"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Learn two cantrips and one level 1 spell from a chosen class list.",
  "featCategory": "origin",
  "prerequisites": [],
  "effects": [
    {
      "type": "grant-trait",
      "trait": {
        "name": "Magic Initiate",
        "description": "You learn two cantrips and one level 1 spell from a chosen class's spell list (Cleric, Druid, or Wizard). You always have the level 1 spell prepared and can cast it once per Long Rest without expending a spell slot.",
        "tags": ["choice-capture", "free-cast-tracking"]
      }
    },
    {
      "type": "grant-resource",
      "resource": {
        "name": "Magic Initiate Free Cast",
        "maxUses": 1,
        "resetOn": "long"
      }
    }
  ]
}
---
Magic Initiate grants extra spells chosen from a single spell list. The exact cantrips, level 1 spell, and spellcasting ability are character-specific choices.
