# Repo Layout (Initial)

This repository starts intentionally minimal.

## Why separate repos?

Current recommendation:

1. Keep `dnd-24-resources` separate for markdown/content lifecycle.
2. Keep `dnd-24-platform` separate for code lifecycle.

Benefits:

- Cleaner commit history (content changes vs code changes)
- Easier publishing/open-sourcing decisions
- Independent release cadence

## Next step when you are ready

When you want implementation scaffolding:

1. Add package manager workspace config at repo root.
2. Build TypeScript domain models in `library/`.
3. Scaffold frontend/backend in `app/`.
