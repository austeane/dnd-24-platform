---
{
  "type": "class-feature",
  "id": "class-feature:bardic-inspiration",
  "slug": "bardic-inspiration",
  "name": "Bardic Inspiration",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-04:Bard/Level 1: Bardic Inspiration"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Use a bonus action to hand out a d6 inspiration die a number of times equal to your Charisma modifier.",
  "classId": "class:bard",
  "level": 1,
  "effects": [
    {
      "type": "grant-action",
      "action": {
        "name": "Bardic Inspiration",
        "timing": "bonus-action",
        "description": "Give one creature within 60 feet a Bardic Inspiration die for the next hour."
      }
    },
    {
      "type": "grant-scaling-resource",
      "resource": {
        "name": "Bardic Inspiration",
        "baseUses": 0,
        "ability": "charisma",
        "minimum": 1,
        "resetOn": "long"
      }
    },
    {
      "type": "grant-trait",
      "trait": {
        "name": "Bardic Inspiration Die",
        "description": "Your Bardic Inspiration die is a d6 until later bard levels improve it."
      }
    }
  ]
}
---
As a bonus action, you inspire another creature within 60 feet that can see or hear you. The creature gains one Bardic Inspiration die to spend within the next hour after failing a d20 test. The die starts as a d6, uses scale with Charisma, and expended uses return on a long rest until higher bard levels change that.
