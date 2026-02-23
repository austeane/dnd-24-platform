# dnd-24-platform

Application and TypeScript library workspace for building on top of SRD 5.2.1 markdown resources.

## Repo Strategy

This project is set up as a **separate repo** from `dnd-24-resources`:

- `dnd-24-resources`:
  Source markdown/content repo (chapters, combined markdown, attribution, QA docs).
- `dnd-24-platform` (this repo):
  Code repo for your TypeScript library and full application.

This split keeps content versioning independent from application code while still allowing fast iteration.

## Folder Layout

- `content/srd-markdown/`
  Local content snapshot target (optional, sync from `../dnd-24-resources`).
- `library/`
  Future TypeScript library (currently empty by request).
- `app/`
  Future full application (currently empty by request).
- `scripts/`
  Utility scripts (includes content sync helper).
- `docs/`
  Project notes and architecture docs.

## Quick Start

1. Sync content snapshot (optional):
   `./scripts/sync-srd-content.sh`
2. Start implementing library in `library/`.
3. Start implementing app in `app/`.

## Notes

- This repo intentionally avoids framework scaffolding for now.
- Source material attribution remains in `content/srd-markdown/ATTRIBUTION.md` after sync.
