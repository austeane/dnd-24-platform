# Tavern Front-End Constraint Register

## Purpose

This document lists the current repo gaps that prevent implementing the Tavern front-end plan to best-practice standards without temporary workarounds.

## Hard constraints

- Front-end baseline is missing. The app currently has only `app/src/routes/__root.tsx`, `app/src/routes/index.tsx`, and `app/src/styles/app.css`; there is no shared component system, no layout primitives, no route-local adapter/query modules, and no design-token layer.
- TanStack Start UI data conventions are not established in the D&D app. Backend services exist under `app/src/server/**`, but there is no existing `createServerFn` usage, no nested character route structure, and no precedent for route-local server wrappers versus shared read-model modules.
- Page-state primitives are missing. There are no reusable loading, skeleton, empty, error, not-found, or disabled-state components.
- App markdown rendering is missing. Journal and compendium data already expose `bodyMd`, but the app has no runtime markdown renderer, sanitization policy, or prose styling component.
- Front-end unit test infrastructure is missing. `app/vitest.unit.config.ts` only targets `src/**/*.test.ts`; there is no `*.test.tsx`, no `jsdom`, no Testing Library, and no shared browser-like setup file.
- Browser acceptance tooling is missing. The repo has no configured Playwright/Cypress/Lighthouse workflow for route-level UI verification.

## Domain and data-model constraints

- Current HP is not modeled. Runtime state exposes `maxHP` only; there is no persistent or computed `currentHP` in the app/runtime path, so the Tavern combat panel cannot truthfully render `current / max` HP without a workaround.
- Spellbook UI requires enrichment. `runtime.spellcasting.grantedSpells` does not carry spell level or display metadata, so spell grouping must join against canonical spell data. There is no existing app read model for this.
- Inventory UI requires multi-source composition. Owned equipment lives in `character_equipment`, while runtime sources only reflect equipped gear projected into runtime state. A best-practice inventory screen needs a dedicated read model joining equipment records, runtime attack profiles, and tracked resources.
- Journal demo content is absent. The seeded real campaign appears to have no published player communication items, so Journal needs a first-class empty state or new seed data.
- Compendium app surface is absent. The library exports raw canonical entities, but the app has no browse/search/filter/detail query layer, URL-state policy, or presentation model for enabled-pack content.

## Best-practice quality gaps

- There is no established UI architecture boundary. Low-level server services exist, but there is no agreed read-model layer for home/roster, character shell, spellbook, inventory, journal, or compendium.
- There is no query/cache convention. The app does not currently use `@tanstack/react-query` or any equivalent client cache/hydration pattern, so richer stale-while-revalidate behavior would require new infrastructure rather than reuse.
- There are no app-level accessibility primitives. The D&D app shell does not yet provide skip links, focus-management helpers, live-region patterns, or shared focus-visible conventions.
- There are no seeded front-end fixtures or story surfaces for the Tavern shell. Beyond the HTML mockup and DB-backed roster, there is no UI fixture layer for rapid iteration and regression checking.

## Not constraints

- Backend mechanics are strong enough to support the planned read-only Tavern shell: campaigns, roster, progression/runtime state, equipment, resources, communication, and canonical content already exist.
- The build pipeline is usable: TanStack Start, Tailwind v4, Vite, Nitro, type-checking, linting, and DB-backed integration tests are already present.

## What must exist before a "no-workaround" build

1. A formal app UI architecture with shared Tavern components, route-local adapters, and server-side read models.
2. A real front-end test stack with TSX tests, DOM environment, Testing Library, and browser acceptance checks.
3. A markdown rendering and prose system for Journal and Compendium.
4. A truth-preserving decision on HP tracking: either model `currentHP` properly or deliberately ship max-only HP.
5. Dedicated read models for spellbook, inventory, journal, and compendium instead of assembling UI directly from raw services ad hoc.
