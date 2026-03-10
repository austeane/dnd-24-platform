# Plan 010: Fleet Execution Model

## Goal

Turn the current repo into something a fleet of agents can work on without thrashing:

- atomic mechanics inventory
- explicit batch ownership
- dependency-aware waves
- evidence-based status changes

This plan is about execution control, not new product scope.

## Fleet-Ready Definition

The repo is ready to hand to a fleet when all of the following are true:

1. The mechanics tracker is atomic enough that a batch can move a small set of rows from `none` or `partial` to `full` without hiding unresolved gaps inside a broad row.
2. Every agent batch has:
   - a bounded goal
   - owned write paths
   - explicit dependencies
   - linked plan refs
   - a fixed verification contract
3. `full` means evidence-backed:
   - canon exists when needed
   - runtime exists when needed
   - persistence exists when the mechanic is stateful
   - mutation flow exists when the mechanic is spendable or reversible
   - tests and/or live acceptance prove it
4. The real campaign roster remains the acceptance target for table-critical mechanics.

## Execution Rules

### 1. Source Of Truth

- Product direction: [Plan 004](004-tabletop-completion-definition.md)
- Build order: [Plan 005](005-execution-roadmap.md)
- Content conversion discipline: [Plan 006](006-agent-content-factory.md)
- Pack model: [Plan 007](007-ruleset-pack-model.md)
- Fleet mechanics/batches: generated reports in `docs/reports/`

### 2. Status Discipline

Do not change a mechanic to `full` because content exists or because a partial runtime stub exists.

Change to `full` only when the relevant verification gates pass.

If evidence is weak, downgrade instead of rationalizing.

### 3. Ownership Discipline

- One batch owns a write scope.
- If two planned batches need the same file, either:
  - split the file first, or
  - serialize those batches.
- Shared read access is fine. Shared write access is not.

### 4. Batch Shape

Each batch should close one dependency cluster:

- content coverage
- progression/persistence
- runtime derivation
- rules/conditions
- verification/acceptance

Avoid batches that mix unrelated layers just because one character happens to need both.

### 5. Acceptance Bias

The real roster is not a demo. It is the first acceptance target.

If a mechanic matters to one of the seeded characters, it should be prioritized ahead of broader compendium breadth.

## Immediate Practical Meaning

The first wave should do two things:

1. Remove remaining execution bottlenecks and expand canon where parallel work is already safe.
2. Strengthen the evidence harness so later batches can update status honestly.

The intentionally plain proof UI stays after this non-UI loop.
