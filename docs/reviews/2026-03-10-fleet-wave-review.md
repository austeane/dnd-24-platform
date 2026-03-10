# Fleet Wave Review

Date: 2026-03-10

Scope:
- Prior Wave 1 verification findings carried forward
- Read-only review of Wave 2-5 code after the fleet-complete merge set

## Findings

### [P1] The app-side runtime projection still ignores persisted condition and resource state

`getCharacterRuntimeState(...)` only loads source rows and XP rows before calling `computeCharacterState(...)`, so none of the newly persisted mutable state is reflected in the returned runtime snapshot. In practice that means DM-applied conditions, resource spends/restores, and rest resets can succeed at the service layer without changing the state the app would actually render.

References:
- `app/src/server/progression/character-state.ts:39-56`
- `app/src/server/progression/condition-state.ts:20-33`
- `app/src/server/progression/resource-state.ts:20-28`
- `docs/reports/roster-acceptance.md:7`

### [P1] The Wave 3/4 “closure” mechanics are still mostly isolated helpers, not integrated runtime behavior

The new closure helpers exist and have direct unit tests, but `computeCharacterState(...)` never appends their dynamic envelopes or applies the pact-blade substitution. As shipped, Alert initiative bonuses, Magic Initiate dynamic spell grants, metamagic traits, Bardic Inspiration die traits, and Pact of the Blade Charisma substitution are not produced by the main runtime path despite multiple “full” tracker entries claiming they are.

References:
- `library/src/engine/character-computer.ts:29-35`
- `library/src/engine/character-computer.ts:62-85`
- `library/src/engine/feats-and-species.ts:360-397`
- `library/src/engine/class-features-casters.ts:144-181`
- `library/src/engine/class-features-casters.ts:514-560`
- `data/mechanics-coverage/srd-5e-2024-atomic.ts:829-835`
- `data/mechanics-coverage/srd-5e-2024-atomic.ts:895-901`
- `docs/reports/roster-acceptance.md:41-44`

### [P2] Resource-pool sync can fail on max-use decreases because the documented clamp is not implemented

`initializeResourcePools(...)` says existing pools preserve `currentUses` but clamp to the new max. The update path only writes the new `maxUses`, so any respec, level-down, or source change that lowers a pool below its current value will hit the `current_uses <= max_uses` check constraint instead of syncing cleanly.

References:
- `app/src/server/progression/resource-state.ts:48-52`
- `app/src/server/progression/resource-state.ts:70-82`
- `app/src/server/db/schema/progression.ts:543-550`

### [P2] Resource spend/restore accepts negative amounts, so the mutation API can move pools in the wrong direction

Neither `spendResource(...)` nor `restoreResource(...)` validates that `amount` is positive. A negative spend increases uses, and a negative restore decreases them. That breaks the invariants these methods are supposed to protect and makes the audit trail misleading at the same time.

References:
- `app/src/server/progression/resource-state.ts:106-115`
- `app/src/server/progression/resource-state.ts:159-161`

### [P2] “Live roster” verification is still fixture replay, not seeded/live acceptance

The snapshot script still reads `verified-characters.json` directly and rebuilds character inputs locally; the paired tests do the same. That means the Wave 5 acceptance layer cannot detect drift in the DB seed, persisted mutable state, or runtime read path, even though the naming and coverage gates imply end-to-end evidence.

References:
- `scripts/snapshot-live-roster.ts:1-6`
- `scripts/snapshot-live-roster.ts:30`
- `scripts/snapshot-live-roster.ts:339-380`
- `library/tests/verification/live-roster-snapshot.test.ts:10-25`
- `data/fleet/fixture-patterns.ts:153-220`

### [P2] Evidence-gate enforcement is still too weak for the upgraded “full” statuses

The gate checker does not enforce the specific declared gates. It only requires any ref matching a broad evidence pattern, and it counts `verified-characters.json` as evidence. A mechanic can therefore declare `live-roster`, `fixtures`, or `mutation` gates and still pass with no actual live acceptance, no mutation test, and no runtime read-path proof.

References:
- `data/mechanics-coverage/types.ts:41-49`
- `data/mechanics-coverage/types.ts:60-86`

### [P3] The determinism tests still do not exercise the real report generators

The “determinism” suite rebuilds simplified summaries inside the test file instead of invoking the report scripts that generate the checked-in artifacts. A bug in the real report scripts can therefore slip through as long as the duplicated helper logic in the test file stays internally consistent.

References:
- `library/tests/verification/report-determinism.test.ts:9-56`
- `library/tests/verification/report-determinism.test.ts:60-110`
- `scripts/report-fleet-readiness.ts`

## Notes

- The codebase is in much better shape mechanically than it was before the fleet pass. The main remaining issue is not lack of modules or lack of tests; it is that several new persistence and mechanic layers are still validated in isolation instead of through the real app-side runtime path.
- I did not modify product code as part of this review.
