---
{
  "type": "feat",
  "id": "feat:alert",
  "slug": "alert",
  "name": "Alert",
  "packId": "srd-5e-2024",
  "sourceEdition": "srd-2024",
  "sourceReference": {
    "sourceTitle": "System Reference Document 5.2.1",
    "locator": "chapter-06:Feats/Alert"
  },
  "adaptationMode": "verbatim",
  "judgement": null,
  "reviewStatus": "verified",
  "summary": "Add proficiency bonus to initiative and optionally swap initiative with a willing ally.",
  "featCategory": "origin",
  "prerequisites": [],
  "effects": [
    {
      "type": "grant-trait",
      "trait": {
        "name": "Alert",
        "description": "You add your Proficiency Bonus to initiative rolls. You can also swap initiative with a willing ally immediately after rolling.",
        "tags": ["initiative-proficiency-bonus"]
      }
    }
  ]
}
---
Alert improves initiative handling. The current engine records it as a named tactical trait; initiative scaling can be expanded into a dedicated dynamic modifier later if needed.
