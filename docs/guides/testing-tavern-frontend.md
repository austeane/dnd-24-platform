# Testing Tavern Frontend

This guide is the current readiness gate for the Tavern surface.

## Readiness Gates

There are two gates:

1. Local disposable Postgres is the primary gate.
2. Railway smoke is the secondary gate.

The app is not ready because `pnpm build` succeeds. It is ready when the Tavern route boundary, read models, and seeded session scenario all hold under a fresh database.

## Fast Path

```bash
pnpm check
pnpm -F @dnd/app test
pnpm -F @dnd/app build
```

Those are the fast compile and unit gates. They do not replace the seeded DB checks below.

## Disposable Postgres Bootstrap

Use a throwaway local Postgres and point `DATABASE_TEST_URL` at it.

```bash
pnpm db:test:up
eval "$(pnpm db:test:env)"
```

The checked-in helper reuses or creates a disposable Docker container named
`dnd-tavern-test` on port `55433` by default. It exports:

- `DATABASE_TEST_URL`
- `DATABASE_URL`
- `DATABASE_PUBLIC_URL`

Useful companion commands:

```bash
pnpm db:test:status
pnpm db:test:down
```

The integration runner will:

- run migrations against `DATABASE_TEST_URL`
- truncate the public tables
- reseed the verified real campaign
- execute the Tavern scenario assertions

## Local DB Verification

Run the primary readiness checks in this order:

```bash
pnpm check
pnpm -F @dnd/app test
DATABASE_TEST_URL="$DATABASE_TEST_URL" pnpm -F @dnd/app test:integration
DATABASE_TEST_URL="$DATABASE_TEST_URL" pnpm snapshot:tavern-session --check
DATABASE_TEST_URL="$DATABASE_TEST_URL" pnpm test:acceptance:tavern
pnpm -F @dnd/app build
```

On the first snapshot capture, create or refresh the baseline:

```bash
DATABASE_TEST_URL="$DATABASE_TEST_URL" pnpm snapshot:tavern-session --update
```

Snapshot files live at:

- `data/fleet/snapshots/tavern-session-baseline.json`
- `data/fleet/snapshots/tavern-session-latest.json`

Before the first browser acceptance run on a machine, install the Playwright browser once:

```bash
pnpm exec playwright install chromium
```

## What The Tavern Scenario Verifies

The scripted scenario uses `real-aa-campaign` and Tali.

It performs this flow:

1. Create a session.
2. Publish a DM rule-callout referencing `Hex` and `Entangle`.
3. Verify Tavern shell, journal, player-card refs, and compendium reads before progression.
4. Award XP.
5. Preview, create, and commit a Druid level-up spend plan.
6. Verify Tavern shell and tab DTOs after the commit.

Current assertions cover:

- shell DTO level progression from 2 to 3
- campaign-aware compendium access
- journal visibility for the published note
- spellbook DTO survival across the level-up flow
- committed spend plan visibility
- XP ledger visibility for the award and spend

## Browser Acceptance

The Round 7 browser gate uses the same seeded Tavern scenario against a built app server.

```bash
DATABASE_TEST_URL="$DATABASE_TEST_URL" pnpm test:acceptance:tavern
```

The browser spec proves this user-visible flow:

1. Home page renders the seeded campaign and roster.
2. Tali’s shell reflects the post-scenario level-up state.
3. Spellbook, inventory, and journal tabs render the expected seeded data.
4. Compendium search resolves the Advanced Adventurers `Hex` detail view.

## Railway Smoke

Use Railway only after the local gate is green.

Run the smoke check inside a Railway-linked environment:

```bash
railway run pnpm verify:railway:tavern
```

The smoke script is read-only. It does three things:

1. Verifies the required public Tavern/progression/communication tables exist.
2. Verifies the `drizzle.__drizzle_migrations` table exists.
3. If parity is present, resolves a real Tavern shell read and a compendium read.

If parity is missing, the script fails early with a missing-table summary and skips the deeper Tavern reads.

As of March 11, 2026, the linked Railway production database was migrated to Tavern parity and successfully reseeded with the Tavern session scenario. The verified remote fixture state is 1 campaign, 5 characters, 1 session, 1 published communication item, 1 committed spend plan, and 2 XP transactions.

To reseed a Railway-linked database with the verified campaign plus the Tavern session scenario:

```bash
railway run pnpm seed:tavern-session -- --destructive
```

That command is destructive. It runs migrations, truncates the public app tables, reseeds the verified campaign, executes the scripted Tali session scenario, and prints a summary of the resulting campaign/session state.

## Manual UI Pass

After the automated gates are green, run the app against a seeded database:

```bash
pnpm -F @dnd/app dev
```

Check:

1. `/` shows the campaign and roster.
2. `/characters/<id>` loads the shell without type or not-found regressions.
3. `Spellbook` uses the parent shell data and still renders correctly.
4. `Inventory` shows equipment plus runtime attacks/resources.
5. `Journal` shows the published session note.
6. `Compendium` filters only to the character’s enabled packs.

## Failure Interpretation

- `pnpm check` failure in Tavern route files: route/server contract drift.
- `pnpm -F @dnd/app test` failure in Tavern DTO tests: adapter or serializer regression.
- `pnpm -F @dnd/app test:integration` failure in the Tavern scenario: seeded DB behavior changed.
- `pnpm snapshot:tavern-session --check` drift: Tavern DTO output changed and needs explicit review.
- `pnpm test:acceptance:tavern` failure: seeded Tavern UI flow regressed in a real browser against a built server.
- `pnpm verify:railway:tavern` failure: Railway parity is incomplete or Tavern reads do not survive real deployment data.
