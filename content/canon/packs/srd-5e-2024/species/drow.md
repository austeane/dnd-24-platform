---
{
  "type": "species",
  "id": "species:drow",
  "slug": "drow",
  "name": "Drow",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-05:Origins/Elf/Drow"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Elf lineage with 120-foot darkvision, Dancing Lights, and later Faerie Fire and Darkness.",
  "traits": ["Darkvision", "Fey Ancestry", "Trance", "Drow Lineage Magic"],
  "effects": [
    { "type": "grant-sense", "sense": { "sense": "Darkvision", "range": 120 } },
    {
      "type": "grant-spell-access",
      "spell": {
        "spellName": "Dancing Lights",
        "spellEntityId": "spell-dancing-lights",
        "spellPackId": "srd-5e-2024",
        "alwaysPrepared": true,
        "source": "Drow Lineage"
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Fey Ancestry",
        "description": "You have advantage on saving throws you make to avoid or end the Charmed condition.",
        "tags": ["advantage-vs-charmed"]
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Trance",
        "description": "You do not need to sleep, magic cannot put you to sleep, and you can finish a Long Rest in 4 hours of meditation.",
        "tags": ["4-hour-long-rest"]
      }
    },
    {
      "type": "grant-spell-access",
      "spell": {
        "spellName": "Faerie Fire",
        "spellEntityId": "spell-faerie-fire",
        "spellPackId": "srd-5e-2024",
        "alwaysPrepared": true,
        "source": "Drow Lineage"
      }
    },
    {
      "type": "grant-resource",
      "resource": {
        "name": "Drow Faerie Fire Free Cast",
        "maxUses": 1,
        "resetOn": "long"
      }
    }
  ]
}
---
Drow characters use the elf chassis with stronger darkvision and lineage magic. The level 1 lineage benefit is Dancing Lights, with Faerie Fire and Darkness arriving later.
