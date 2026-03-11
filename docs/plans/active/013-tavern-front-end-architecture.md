# Tavern Front-End Architecture Plan, Revised

This document superseded `012-tavern-design-system.md` for Tavern implementation. As of March 11, 2026, it should be treated as the delivered architecture record for the read-only Tavern shell, not the next active build tranche.

## Status

- Round 5-6 Tavern architecture is substantially implemented.
- The app now ships the planned read-only Tavern surfaces: home/roster, character shell, spellbook, inventory, journal, and compendium.
- The remaining active work is Round 7 readiness: browser acceptance coverage, accessibility hardening, responsive verification, and explicit closure or deferral of the remaining constraints in [014-tavern-frontend-constraint-register.md](014-tavern-frontend-constraint-register.md).

## Delivered Architecture

- Tavern read composition lives under `app/src/server/tavern/` with dedicated modules for home, character shell, spellbook, inventory, journal, compendium, shared pack handling, and session-scenario verification.
- Route-adjacent `createServerFn` wrappers live in `app/src/routes/index/-server.ts` and `app/src/routes/characters/$characterId/-server.ts`.
- Character routes use nested TanStack route files under `app/src/routes/characters/$characterId/`.
- The parent character loader returns a JSON-safe Tavern shell DTO, not raw runtime state:
  `campaign`, `character`, `summary`, `spellbook`, and `inventoryRuntime`.
- Spellbook, inventory, journal, and compendium all resolve through Tavern-specific read models instead of assembling UI directly from low-level services inside route components.
- Pack filtering is campaign-aware. Spellbook and compendium reads use the campaign’s enabled packs rather than hard-coded defaults.
- Journal and compendium bodies render Markdown through app runtime components.
- The shell preserves inert `Level Up` and `Long Rest` hero actions with disabled-state messaging, as planned.

## What Landed

- Foundation: Tavern layout, nav, atmospheric styling, page-state primitives, markdown skin.
- Home/Roster: campaign sections with live roster links.
- Character Shell: shared loader, tab nav, shell chrome, not-found behavior.
- Character Tab: hero summary, XP state, abilities, combat, skills, and features.
- Spellbook: live casting stats, grouped spells, slot pools, pack-aware canonical enrichment.
- Inventory: equipment items plus runtime attacks and tracked resources.
- Journal: published player communication cards with first-class empty/populated states.
- Compendium: enabled-pack browse, filter, search, and detail via URL state.
- Verification: adapter/unit coverage, seeded Tavern session scenario integration coverage, Tavern snapshot coverage, Railway schema/read smoke, and a destructive seed path for the Tavern fixture.

## Remaining Round 7 Work

- Keep browser acceptance coverage in place and expand it beyond the seeded happy path.
- Add explicit responsive verification at the target breakpoints from [011-fleet-swarm-wave-1-close-wave-2-launch.md](011-fleet-swarm-wave-1-close-wave-2-launch.md).
- Add accessibility primitives and formal audits instead of relying only on component-level good behavior.
- Decide which remaining constraints are true blockers versus explicit deferrals and update Plan 014 accordingly.
- Keep mutation flows out of this tranche. The Tavern shell remains read-only until a separate interaction plan is approved.

## Verification Standard

The Tavern front end should now be judged by the readiness guide in `docs/guides/testing-tavern-frontend.md`, not by whether the original architecture plan is merely coded.

Current high-signal gates are:

1. `pnpm check`
2. `pnpm -F @dnd/app test`
3. `DATABASE_TEST_URL=... pnpm -F @dnd/app test:integration`
4. `DATABASE_TEST_URL=... pnpm snapshot:tavern-session --check`
5. `DATABASE_TEST_URL=... pnpm test:acceptance:tavern`
6. `railway run pnpm verify:railway:tavern`

## Deferred Work

- Mutation UI for level-up, rest flows, and other character actions.
- Truthful current-HP tracking in the Tavern shell.
- Rich client caching beyond TanStack Start loader behavior.
