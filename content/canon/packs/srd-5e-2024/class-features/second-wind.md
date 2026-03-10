---
{
  "type": "class-feature",
  "id": "class-feature:second-wind",
  "slug": "second-wind",
  "name": "Second Wind",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-04:Fighter/Level 1: Second Wind"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Use a bonus action to heal 1d10 plus fighter level, with two uses that refresh over rests.",
  "classId": "class:fighter",
  "level": 1,
  "effects": [
    {
      "type": "grant-action",
      "action": {
        "name": "Second Wind",
        "timing": "bonus-action",
        "description": "Regain 1d10 + Fighter level Hit Points."
      }
    },
    {
      "type": "grant-resource",
      "resource": {
        "name": "Second Wind",
        "maxUses": 2,
        "resetOn": "short"
      }
    }
  ]
}
---
Second Wind is a bonus-action self-heal. Fighters begin with two uses, recover one on a short rest, and recover all uses on a long rest.
