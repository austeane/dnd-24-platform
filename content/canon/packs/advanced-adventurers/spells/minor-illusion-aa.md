---
{
  "type": "spell",
  "id": "aa-spell-minor-illusion",
  "slug": "minor-illusion-aa",
  "name": "Minor Illusion",
  "packId": "advanced-adventurers",
  "sourceEdition": "aa-2024-adapted",
  "sourceReference": {
    "sourceTitle": "Advanced Adventurers",
    "locator": "combined.md:image19:Improved Minor Illusion"
  },
  "adaptationMode": "ported-with-judgement",
  "judgement": {
    "isJudgementCall": true,
    "judgementBasis": "AA's Improved Minor Illusion is carried forward onto the 2024 baseline as an overlay that allows both a sound and an image from one casting. This remains a judgement-call adaptation because the AA feature modifies the spell's options rather than replacing the SRD spell text outright.",
    "derivedFrom": [
      {
        "label": "2024 SRD Minor Illusion",
        "sourceEdition": "srd-2024",
        "sourceReference": {
          "sourceTitle": "System Reference Document 5.2.1",
          "locator": "chapter-08:Minor Illusion"
        },
        "packId": "srd-5e-2024",
        "entityId": "spell-minor-illusion"
      },
      {
        "label": "AA Improved Minor Illusion",
        "sourceEdition": "aa-2014",
        "sourceReference": {
          "sourceTitle": "Advanced Adventurers",
          "locator": "combined.md:image19:Improved Minor Illusion"
        }
      }
    ]
  },
  "reviewStatus": "llm-judgement",
  "summary": "AA universal-access overlay for Minor Illusion using 2024 text and explicit judgement metadata for the dual-sound-and-image upgrade.",
  "tags": ["aa", "cantrip", "illusion"],
  "level": 0,
  "school": "Illusion",
  "classes": [],
  "availability": "aa-universal",
  "castingTime": "Action",
  "ritual": false,
  "range": "30 feet",
  "components": {
    "verbal": false,
    "somatic": true,
    "material": "a bit of fleece"
  },
  "duration": "1 minute",
  "concentration": false,
  "overlayTarget": {
    "packId": "srd-5e-2024",
    "entityId": "spell-minor-illusion"
  },
  "aaSection": "Improved Minor Illusion",
  "linkedAaAbilityIds": ["aa-ability-improved-minor-illusion"],
  "interactionTypes": ["modifier"]
}
---
You create a sound or an image of an object within range that lasts for the duration. The illusion ends if you cast this spell again.

If a creature takes the Study action to examine the sound or image, the creature can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC.

If you create a sound, its volume can range from a whisper to a scream. If you create an image of an object, it must be no larger than a 5-foot Cube and it can't create sound, light, smell, or any other sensory effect.
