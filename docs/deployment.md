# Deployment

The DnD app deploys to `www.austinwallace.ca/dnd` via Railway + SST Router (CloudFront).

## Architecture

```
Browser → CloudFront (SST Router) → /dnd/* → Railway (TanStack Start/Nitro)
                                             → Railway Postgres
```

The SST Router in `austin-site` prefix-matches `/dnd` and forwards all requests to the Railway origin. The app handles the `/dnd` prefix natively via `VITE_BASE_PATH`, so no URL rewriting is needed. This is the same pattern used by `/survey`.

## Railway Setup

**Service**: `dnd-platform` (auto-deploys from git)

**Environment variables**:
- `VITE_BASE_PATH=/dnd/` — Configures Vite `base` and Nitro `baseURL` so all assets and routes use the `/dnd` prefix
- `DATABASE_URL` — Provisioned automatically by Railway Postgres addon

**Build**: Railway auto-detects pnpm, runs `pnpm install` → `pnpm build` → `pnpm start` (`node .output/server/index.mjs`).

## Base Path Configuration

`VITE_BASE_PATH` is read in two places:

1. **`app/vite.config.ts`** — Sets Vite `base` (asset paths) and Nitro `baseURL` (server routes)
2. **`app/src/router.tsx`** — Sets TanStack Router `basepath` (client-side routing)

Locally, `VITE_BASE_PATH` is unset, so everything defaults to `/` and dev works normally at `http://localhost:3001/`.

## SST Router Integration

In `austin-site/sst.config.ts`:

```ts
const DND_ORIGIN = process.env.DND_ORIGIN ?? "https://dnd-platform-production.up.railway.app";
router.route("/dnd", DND_ORIGIN);
```

After changing the SST config, deploy with `npx sst deploy --stage production` from the austin-site repo.

## Verification

1. **Local dev**: `pnpm -F @dnd/app dev` works at `http://localhost:3001/`
2. **Base path build**: `VITE_BASE_PATH=/dnd/ pnpm -F @dnd/app build` — check that `.output` HTML references `/dnd/...` asset paths
3. **Production**: `https://www.austinwallace.ca/dnd` loads the app, client-side navigation works, API routes respond at `/dnd/api/...`
