# Tavern Front-End Architecture Plan, Revised

This document supersedes `012-tavern-design-system.md` as the active implementation plan for the Tavern front end.

## Summary

- Build the tavern front end as one planned architecture, but implement it in mergeable surfaces: `foundation -> home/roster -> character shell -> character tab -> spellbook -> inventory -> journal -> compendium -> test/polish`.
- Completion bar remains the full tavern shell, but no single surface should block unrelated work from landing.
- Keep the tranche read-only. All routes are real and data-backed; no mutation flows ship here.

## Architecture Changes

- Keep backend read composition under `app/src/server/tavern/` as pure async functions:
  `home.ts`, `character-shell.ts`, `compendium.ts`.
- Keep `createServerFn` wrappers route-adjacent:
  `app/src/routes/index/-server.ts` and `app/src/routes/characters/$characterId/-server.ts`.
- Keep pure UI mapping route-adjacent:
  `app/src/routes/index/-adapters.ts` and `app/src/routes/characters/$characterId/-adapters.ts`.
- Build shared presentational pieces under `app/src/components/tavern/`; do not introduce a mixed `features/tavern/` module that combines server, client, and route concerns.
- Use nested TanStack routes under `app/src/routes/characters/$characterId/` with `route.tsx`, `index.tsx`, `spellbook.tsx`, `inventory.tsx`, `journal.tsx`, and `compendium.tsx`.
- Parent character route loader returns a `CharacterShellData` read model:
  `campaign`, `character`, `runtime`, `equipment`, `journalCards`.
- `CombatPanelProps` must accept `currentHp?: number` and `maxHp: number`.
  The HP bar renders the full mockup only when `currentHp` exists; otherwise it renders a truth-preserving max-HP state with a styled "tracking not yet modeled" treatment.
- Preserve the mockup's hero actions visually. Keep `Level Up` and `Long Rest` buttons in place, but render them inert with `aria-disabled`, explanatory copy, and no fake navigation.
- Use `react-markdown` in the app for Journal and Compendium bodies. Do not reuse the library's compile-time parsing utilities as a runtime HTML pipeline.
- Load fonts and tavern tokens globally in `app/src/routes/__root.tsx`, `app/src/styles/app.css`, and `app/src/styles/tavern.css`.

## Route and Screen Scope

- Replace `/` with a tavern home screen that lists campaigns and their roster cards using `listCampaigns` plus `listCampaignRoster`.
- Use `characterId` in routes for this phase; do not switch to campaign-scoped slug URLs.
- Character tab is mockup-faithful: hero, XP/progression, abilities, combat, skills, and features.
- Spellbook tab is real: casting ability, spell DC/attack, slot pools, capacities, and spells grouped by canonical spell level by joining runtime `grantedSpells` to canonical spell metadata.
- Inventory tab is real: equipped items, carried/stowed items, attack profiles, and tracked resources. Source data comes from both `listCharacterEquipment` and `runtime.attackProfiles`; do not infer inventory from `runtime.sources`.
- Journal tab is real: `listPlayerCommunicationCards(campaignId, characterId)` with first-class empty-state design, not a fallback placeholder.
- Compendium tab is real but intentionally simplified: browse enabled-pack `CanonicalEntity` records directly from existing catalog helpers, filtered by `type`, `pack`, and `q`. Do not invent a large cross-type normalization layer.
- Compendium detail rendering uses existing `CanonicalEntity` fields (`name`, `summary`, `bodyMd`, `tags`) and URL search params `q`, `type`, `pack`, and `entry`.

## Delivery Sequence

- Foundation: tavern theme tokens, global atmosphere, markdown skin, shell layout, nav, empty/error/loading primitives.
- Home/Roster: campaign sections and roster cards with links into the character shell.
- Character Shell: nested route structure, shared loader, tab nav, shared page chrome.
- Character/Spellbook/Inventory: the three mechanically strongest tabs first.
- Journal: player communication surface with polished empty and populated states.
- Compendium: enabled-pack browse/detail screen using existing canonical entities, not a new compendium domain model.
- Polish last: responsive tuning, animation staggering, accessibility pass, and disabled-state messaging for not-yet-built actions.

## Test Plan

- Add proper front-end unit test infrastructure up front: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `jsdom`; update `app/vitest.unit.config.ts` to include `*.test.tsx`.
- Test pure server read functions in `app/src/server/tavern/` directly; keep route `createServerFn` wrappers thin and mostly untested.
- Add adapter tests for caster vs non-caster spellbook output, inventory grouping, compendium filter shaping, and max-HP-without-current-HP combat rendering.
- Add render tests for home/roster, tab shell, journal empty state, spellbook empty state, and compendium search/filter/detail behavior.
- Keep DB-backed integration coverage and add one tavern integration spec that seeds the real campaign and proves home plus all five tab datasets resolve.
- Acceptance commands are `pnpm -w run check`, `pnpm -w run lint`, `pnpm -F @dnd/app build`, `pnpm -F @dnd/app test`, and `pnpm -F @dnd/app test:integration`.

## Assumptions and Defaults

- Current HP is not modeled in the existing runtime/store, so this phase must not fake it.
- Journal may be empty against the seeded campaign; the empty state is part of the designed experience.
- Compendium v1 covers the existing canonical entity set already in the workspace; it is "real" without becoming a new normalization project.
- `routeTree.gen.ts` remains generated output and is never edited by hand.
