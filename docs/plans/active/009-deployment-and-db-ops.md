# Plan 009: Deployment And DB Ops

## Goal

Make deployment concrete and repeatable for both app code and database schema.

This plan covers hosting, database connectivity, migration flow, and the operational split between local commands and Railway runtime.

## Current State

- App hosting target exists: Railway app behind SST Router at `/dnd`
- Railway Postgres exists in the same Railway project
- Drizzle is configured in the repo
- Initial communication migration exists

## Required Guarantees

1. The deployed app always uses Railway internal database networking.
2. Local Drizzle commands can reach the same database through a public connection URL.
3. Production schema changes happen through generated migrations committed to git.
4. Deployment instructions are short enough to follow during real work.

## Operating Model

### Runtime

- Railway app service uses `DATABASE_URL`
- App code connects with the runtime client

### Local database operations

- Local `drizzle-kit` and migration scripts use `DATABASE_PUBLIC_URL` when present
- This avoids the `postgres.railway.internal` hostname problem outside Railway

### Production schema changes

1. Update schema in repo
2. Generate migration
3. Commit migration
4. Apply migration to target database
5. Deploy app code

## Non-Goals

- Full CI/CD automation for migrations
- Multi-environment promotion flow
- Blue/green database strategy

Those can come later once the app has more real state.

## Exit Criteria

- Docs describe the real deploy path, not a guessed one
- Local Drizzle commands can target Railway Postgres
- The live Railway database has the generated schema
- The repo has one clear migration workflow
