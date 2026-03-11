# Tavern Front-End Constraint Register

## Purpose

This document now tracks the remaining constraints that still matter after the Round 5-6 Tavern build landed. It is no longer accurate to treat the original front-end baseline and read-model gaps as open problems.

## Resolved Since The Original Draft

- The Tavern front-end baseline exists: shared layout, nav, presentational components, route-local adapters, Tavern styles, and page-state primitives are in the app.
- TanStack Start server-wrapper conventions now exist in the D&D app, with route-adjacent `createServerFn` wrappers and Tavern read models under `app/src/server/tavern/`.
- App markdown rendering exists and is used for Journal and Compendium bodies.
- Front-end unit test infrastructure exists: `jsdom`, `*.test.tsx`, Testing Library matchers, and route/adapter/component tests are already in place.
- Dedicated read models exist for spellbook, inventory, journal, compendium, and the Tavern shell.
- Seeded Tavern verification exists: DB-backed scenario integration coverage, snapshot coverage, Railway smoke verification, and a destructive Tavern session reseed path.
- Browser acceptance tooling now exists in initial form via Playwright and the seeded Tavern session flow.

## Remaining Hard Constraints

- Current HP is still not modeled truthfully. The Tavern combat panel can only render max HP plus explicit “not yet modeled” messaging.
- Browser acceptance coverage is still narrow. There is one seeded happy-path Tavern session flow, but not yet a broader matrix for empty states, not-found states, mobile breakpoints, or regression-heavy navigation paths.
- App-level accessibility primitives are still thin. The Tavern UI does not yet have a formalized layer for skip links, focus restoration, or live-region behavior across route changes.
- Lighthouse and accessibility scoring are not yet part of the automated readiness gate.
- There is still no lightweight front-end fixture/story surface outside the DB-backed Tavern scenario and snapshots, which makes isolated UI iteration slower than it should be.

## Non-Constraints

- Backend mechanics are strong enough to support the read-only Tavern shell.
- Tavern route/server boundaries now exist and are typed with Tavern DTOs rather than raw runtime state.
- Campaign-aware pack resolution is implemented for spellbook and compendium.
- Railway schema parity and Tavern smoke parity are established.
- The app does not need React Query or a richer client cache to ship the read-only Tavern surface.

## Current "No-Workaround" Bar

The Tavern front end is close to readiness when all of the following are true:

1. The seeded browser acceptance flow stays green.
2. Responsive verification is explicit at the target breakpoints.
3. Accessibility primitives and audits are added, with Lighthouse accessibility meeting the project target.
4. Remaining gaps in this register are either resolved or explicitly deferred with rationale.
5. The verification guide in `docs/guides/testing-tavern-frontend.md` stays current with the actual gates and fixture paths.
