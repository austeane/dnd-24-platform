# Real Campaign Intake

This directory stages the first real-campaign intake from the phone photos in:

- `/Users/austin/dev/dnd/dnd character sheets`

Files here are not authoritative character state. They are intake artifacts used to bootstrap verified seed data.

## Files

- `raw-pages.json`
  One OCR-assisted record per image page, including source filename, OCR text, page-role guess, and coarse extracted hints.
- `verified-characters.json`
  The current reviewed seed file for the real AA campaign. This is the input for `pnpm seed:real-campaign`.
- `verified-characters.template.json`
  The target shape for future verified campaign seed data.

## Rules

- Do not silently trust OCR for spell details, checkbox state, or handwritten notes.
- Treat OCR as assistive extraction only.
- Pair pages into characters explicitly during verification.
- Once a character is verified and seeded into the app, that seeded record becomes the operative source of truth.
- Keep uncertain mechanics as notes or unmodeled feature sources rather than inventing precise rules text.
