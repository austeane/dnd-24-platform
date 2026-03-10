---
{
  "type": "species",
  "id": "species:wood-elf",
  "slug": "wood-elf",
  "name": "Wood Elf",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-05:Origins/Elf/Wood Elf"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Elf lineage with 35-foot speed and the Druidcraft cantrip.",
  "traits": ["Darkvision", "Fey Ancestry", "Trance", "Wood Elf Lineage"],
  "effects": [
    { "type": "speed-bonus", "value": 5, "movementType": "walk" },
    { "type": "grant-sense", "sense": { "sense": "Darkvision", "range": 60 } },
    {
      "type": "grant-spell-access",
      "spell": {
        "spellName": "Druidcraft",
        "spellEntityId": "spell-druidcraft",
        "spellPackId": "srd-5e-2024",
        "alwaysPrepared": true,
        "source": "Wood Elf Lineage"
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Fey Ancestry",
        "description": "You have advantage on saving throws you make to avoid or end the Charmed condition."
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Trance",
        "description": "You do not need to sleep, magic cannot put you to sleep, and you can finish a Long Rest in 4 hours of meditation."
      }
    }
  ]
}
---
Wood Elves use the elf chassis but add faster movement and Druidcraft at level 1.
