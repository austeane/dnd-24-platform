# Deployment

The DnD app deploys to `www.austinwallace.ca/dnd` via Railway + SST Router (CloudFront), with Postgres on Railway and schema management through Drizzle.

## Architecture

```
Browser → CloudFront (SST Router) → /dnd/* → Railway app (TanStack Start/Nitro)
                                             → Railway Postgres
```

The SST Router in `austin-site` prefix-matches `/dnd` and forwards all requests to the Railway origin. The app handles the `/dnd` prefix natively via `VITE_BASE_PATH`, so no URL rewriting is needed. This is the same pattern used by `/survey`.

## Current Railway State

As of March 11, 2026, this repo is linked to:

- Project: `dnd-platform`
- Environment: `production`
- Service: `app`
- Postgres service: `Postgres`
- Public app origin: `https://app-production-0cb2.up.railway.app`

## Railway Setup

**App service environment variables**

- `VITE_BASE_PATH=/dnd/` — Configures Vite `base` and Nitro `baseURL`
- `DATABASE_URL` — Internal Railway Postgres URL, used by the deployed app runtime

**Postgres service variables**

- `DATABASE_PUBLIC_URL` — Public Postgres URL for local Drizzle commands from your machine
- `DATABASE_URL` — Internal Railway Postgres URL for in-network Railway services

**Build**

Railway auto-detects pnpm and runs:

1. `pnpm install`
2. `pnpm build`
3. `pnpm start`

The app entrypoint is `node app/.output/server/index.mjs`.

## Database Wiring

The codebase now distinguishes runtime and migration URLs:

- `getRuntimeDatabaseUrl()` prefers `DATABASE_URL`
- `getMigrationDatabaseUrl()` prefers `DATABASE_PUBLIC_URL`
- `drizzle.config.ts` prefers `DATABASE_PUBLIC_URL` when available so local `drizzle-kit` commands can reach Railway Postgres

This matters because Railway injects an internal hostname like `postgres.railway.internal` into the app service. That hostname is correct for deployed services inside Railway, but it is not reachable from your laptop. Local Drizzle commands must use the public proxy URL instead.

## Drizzle Commands

From the repo root:

```bash
pnpm db:generate
pnpm db:check
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

From the app package:

```bash
pnpm db:generate
pnpm db:check
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

### Command Expectations

- `db:generate` does not require a live database
- `db:check` validates the generated migration set
- `db:migrate` applies generated SQL migrations
- `db:push` applies the current schema directly
- `db:studio` opens Drizzle Studio against the configured database

For local commands against Railway Postgres, set `DATABASE_PUBLIC_URL`.

## First Provisioning

1. Generate migrations:
   `pnpm db:generate`
2. Apply migrations to Railway Postgres using `DATABASE_PUBLIC_URL`
3. Deploy the app to Railway
4. Verify the production app and DB-backed routes
5. If the database was reseeded or the auth tables are empty, bootstrap DM access and set player passwords from the DM dashboard

## Deploy Flow

### Code deploy

The app service can auto-deploy from git on Railway, or you can deploy the current linked workspace directly. The important part is that the DB migration and the app deploy stay in lockstep.

### Schema deploy

Use generated migrations. The intended order is:

1. Merge code and generated migration files
2. Run `pnpm db:migrate` against the target database
3. Deploy or confirm the Railway deploy

Do not rely on `db:push` for normal production changes. Use generated migrations so schema history stays in git.

## March 11 Production Runbook

This is the runbook that brought the first full write-enabled Tavern build live:

1. `pnpm db:check`
2. Set `DATABASE_PUBLIC_URL` to the Railway Postgres public proxy URL
3. `pnpm db:migrate`
4. Deploy the Railway `app` service in the `production` environment
5. Verify `https://www.austinwallace.ca/dnd/` in a real browser
6. If the DB was reseeded, visit `/dnd/campaigns/<slug>/access?role=dm&next=%2Fdnd%2Fcampaigns%2F<slug>%2Fdm` and create the first DM password
7. Use the DM dashboard `Access` section to create/reset player passwords

The production bug caught during that deploy was not a DB issue. It was raw server-built `/campaigns/...` and `/characters/...` links bypassing the `/dnd` base path.

## Base Path Configuration

`VITE_BASE_PATH` is read in two places:

1. **`app/vite.config.ts`** — Sets Vite `base` (asset paths) and Nitro `baseURL` (server routes)
2. **`app/src/router.tsx`** — Sets TanStack Router `basepath` (client-side routing)

Any plain string `href` or redirect emitted outside TanStack Router also needs the base path. Use `app/src/lib/base-path.ts` and do not hand-build raw `/campaigns/...` or `/characters/...` URLs for server responses or plain anchors.

Locally, `VITE_BASE_PATH` is unset, so everything defaults to `/` and dev works normally at `http://localhost:3001/`.

## SST Router Integration

In `austin-site/sst.config.ts`:

```ts
const DND_ORIGIN = process.env.DND_ORIGIN ?? "https://app-production-0cb2.up.railway.app";
router.route("/dnd", DND_ORIGIN);
```

After changing the SST config, deploy from the austin-site repo:

```bash
cd ~/dev/austin-site && AWS_PROFILE=prod npx sst deploy --stage production
```

## Verification

1. **Local dev**: `pnpm -F @dnd/app dev` works at `http://localhost:3001/`
2. **Base path build**: `VITE_BASE_PATH=/dnd/ pnpm -F @dnd/app build` — check that `.output` HTML references `/dnd/...` asset paths
3. **Migration set**: `pnpm db:check` passes
4. **Production DB**: migrations apply cleanly against Railway Postgres
5. **Production**: `https://www.austinwallace.ca/dnd` loads the app, client-side navigation works, API routes respond at `/dnd/api/...`
6. **Public Tavern smoke**:
   - home renders `/dnd/...` DM and character links
   - DM access loads at `/dnd/campaigns/<slug>/access`
   - at least one player login succeeds
   - one write mutation such as HP damage + heal restore succeeds on the public domain
