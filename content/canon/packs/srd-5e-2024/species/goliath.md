---
{
  "type": "species",
  "id": "species:goliath",
  "slug": "goliath",
  "name": "Goliath",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-05:Origins/Goliath"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Large-framed species with a giant-ancestry boon such as Stone's Endurance.",
  "traits": ["Giant Ancestry"],
  "effects": [
    {
      "type": "grant-action",
      "action": {
        "name": "Stone's Endurance",
        "timing": "reaction",
        "description": "When you take damage, roll 1d12 and add Constitution to reduce the damage."
      }
    },
    {
      "type": "grant-scaling-resource",
      "resource": {
        "name": "Stone's Endurance",
        "baseUses": 0,
        "mode": "proficiency-bonus",
        "minimum": 1,
        "resetOn": "long"
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Giant Ancestry",
        "description": "You inherit one giant-themed supernatural boon. This entry models Stone's Endurance."
      }
    }
  ]
}
---
Goliaths choose one giant-ancestry boon. For the current roster, Stone's Endurance is the relevant modeled choice.
