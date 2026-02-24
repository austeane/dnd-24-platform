# Meta-Plan: Agent-First Development Philosophy

Adapted from [OpenAI's harness engineering approach](https://openai.com/index/harness-engineering/).

## Core Principle

**Humans steer. Agents execute.**

The primary job is not to write code, but to design environments, specify intent, and build feedback loops that let agents do reliable work. When something fails, the fix is never "try harder" — it's "what capability is missing, and how do we make it legible and enforceable?"

## Project

A D&D 2024 campaign platform supporting three progression modes:
- **Standard 5e 2024**: classes, levels, traditional PHB rules
- **AA Only**: no classes, XP-as-currency, ability purchases (Advanced Adventurers system)
- **Hybrid**: classes + AA purchases (XP can buy class levels OR AA abilities)

## Architecture Principles

1. **Library-first**: All game logic lives in `@dnd/library`. Pure TypeScript, zero React/DB deps. The app calls the library, never the reverse.
2. **Unified effect model**: Every character modifier flows through `Source → Effect[] → CharacterState`. Classes, AA purchases, items, feats — all produce Effects through the same interface.
3. **Parsers are deterministic**: Same markdown in, same typed data out. No side effects, no network calls.
4. **The app is a thin layer**: Routing, persistence, UI. Game logic calls the library.
5. **Validate at boundaries**: Zod for API inputs, TypeScript strict mode for internal contracts.

## Tech Choices

| What | Why |
|------|-----|
| pnpm workspaces | Monorepo without framework overhead |
| TypeScript strict | Catch bugs, agent-friendly |
| Vitest | Fast, TS-native, good watch mode |
| oxlint | 50-100x faster than eslint, good enough rules |
| husky + lint-staged | Pre-commit gate |
| unified/remark | Markdown AST parsing for SRD chapters |
| TanStack Start | SSR + server functions, type-safe routing |
| Drizzle | Type-safe SQL, good migration story |
| Postgres | CRUD app with campaigns, characters, transactions |
| Postgres FTS | tsvector/tsquery for search; upgrade only if insufficient |
| TipTap | ProseMirror-based, extensible for @mentions |
| Tailwind v4 | Utility CSS, agent-friendly |

## CLAUDE.md Philosophy

Following the lesson: "We tried the one big AGENTS.md approach. It failed."

CLAUDE.md should be:
- **Short** (~100 lines) — a table of contents, not a manual
- **Stable** — change rarely, point to things that change often
- **Navigational** — tell agents where to look, not what to do

## Mechanical Enforcement Over Documentation

> "When documentation falls short, promote the rule into code."

### Enforcement Stack

1. **oxlint** — Fast linter on staged files
2. **TypeScript strict mode** — `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
3. **Pre-commit hooks** (husky + lint-staged): lint staged `.ts`/`.tsx` files

When an agent hits a lint failure, the error message should tell it how to fix it.

## Repository as System of Record

Anything not in the repo doesn't exist for agents.

### Knowledge Architecture

```
dnd-24-platform/
├── CLAUDE.md              # ~100 lines, table of contents
├── META-PLAN.md           # This file: philosophy and patterns
├── docs/
│   ├── architecture.md    # Library design, effect model, parsing
│   ├── campaign-modes.md  # Progression mode rules
│   └── plans/
│       ├── active/        # In-progress execution plans
│       └── completed/     # Done plans (for context)
```

## Plan Workflow

1. Plans are created in `docs/plans/active/` with format `NNN-slug.md`
2. Plans include: goal, approach, file changes, acceptance criteria
3. Completed plans move to `docs/plans/completed/`

## What This Means in Practice

When building a feature:
1. Write the execution plan (`docs/plans/active/`)
2. Define the types first
3. Implement with mechanical enforcement (lints, types, tests)
4. Validate via tests + UI
5. Move plan to completed when done

When something breaks:
1. Don't "try harder" — ask what's missing
2. If the agent can't find context → add it to docs
3. If the agent makes a mistake → add a lint rule
4. If the pattern drifts → add a structural test

The goal is a codebase that gets easier for agents to work in over time, not harder.
