# Plan: Implement "Warm Tavern" Design System

## Context

The app frontend is a blank canvas — just `@import "tailwindcss"` and a bare homepage. The backend is mature (auth, progression engine, campaigns, DB schema). The Tavern design was finalized in `design-exploration/option-c-tavern.html` — a warm, parchment-and-wood aesthetic with Fraunces/Source Sans 3/IBM Plex Mono typography, ember accents, and responsive breakpoints.

This plan ports the mockup into a real React component library + Tailwind v4 theme, then wires it to `CharacterState` data via TanStack server functions.

---

## Phase 1: Design Foundation

**Goal**: Theme tokens, fonts, global atmosphere CSS — everything components depend on.

### 1a. Tailwind v4 `@theme` block in `app/src/styles/app.css`

Add all Tavern colors, shadows, fonts, and border-radius tokens using Tailwind v4's `@theme` syntax. This gives us utilities like `bg-cream`, `text-ink`, `font-heading`, `shadow-tavern`, etc.

Colors: cream, cream-warm, parchment, paper, paper-deep, wood, wood-dark, wood-light, ink, ink-soft, ember, ember-glow, forest, forest-light, sky, brass, border, border-light

### 1b. Global atmosphere CSS in `app/src/styles/app.css`

Below the theme block, add the three body layers that create the Tavern feel:
- Body background (multi-stop radial + linear gradients)
- `body::before` — SVG noise paper texture overlay (`position: fixed; pointer-events: none; z-index: 1000`)
- `body::after` — edge vignette darkening
- `@keyframes fadeUp` + `prefers-reduced-motion` query

### 1c. Component CSS in `app/src/styles/tavern.css`

A small (~120 lines) CSS file for patterns too complex for Tailwind inline classes:
- `.tavern-card` — gradient background, inset highlight `::before`, border
- `.tavern-nav` — wood-grain gradient, striations `::before`, bottom highlight `::after`
- `.content-grid` — `grid-template-areas` (Tailwind has no utility for this) + responsive breakpoints
- `.animate-fade-up` — animation with `--delay` custom property for staggering

Import from app.css: `@import "./tavern.css";`

### 1d. Font loading in `app/src/routes/__root.tsx`

Add Google Fonts preconnect + stylesheet links to the `head()` function:
- Fraunces (variable, 300–800 + italic)
- Source Sans 3 (300–600 + italic)
- IBM Plex Mono (300–500)

---

## Phase 2: Component Library

**Goal**: React components that map to every section of the character sheet mockup.

### File structure

```
app/src/components/
  ui/
    Button.tsx            # warm | outline variants
    Card.tsx              # Header (title + count badge) + body wrapper
    StatBadge.tsx         # Level/class/species pill tags
    ProgressBar.tsx       # HP and XP bars (variant prop)
    SlotDots.tsx          # Spell slot filled/empty circles
  layout/
    TavernNav.tsx         # Sticky wood-grain nav bar
    TavernLayout.tsx      # <main> wrapper with max-width + padding
  character/
    CharacterCard.tsx     # Hero card: avatar, name, class info, actions
    XPProgressBar.tsx     # XP section with label + bar + numbers
    AbilityScoreRow.tsx   # 6-card grid (delegates to AbilityScoreCard)
    AbilityScoreCard.tsx  # Single ability score with data-primary support
    CombatPanel.tsx       # HP bar, AC, initiative, speed, spell save DC
    SkillsPanel.tsx       # Skills list with proficiency dots
    FeaturesPanel.tsx     # Traits/features list
    SpellsPanel.tsx       # Spell groups by level with slot dots
```

### Key component interfaces

**CharacterCard** — receives `name`, `subtitle` (class + background), `level`, `className`, `species`, `onLevelUp?`, `onLongRest?`

**AbilityScoreRow** — receives `abilities: Array<{ name, score, modifier, isPrimary }>`. The `isPrimary` flag drives the `data-primary` attribute highlight. Determined by `state.spellcasting?.ability`.

**CombatPanel** — receives `currentHP`, `maxHP`, `armorClass` (number), `acBreakdown`, `initiative`, `speed`, `spellSaveDC?`, `proficiencyBonus`

**SkillsPanel** — receives `skills: Array<{ name, bonus, proficient, expertise }>` from `state.skillState.skills`

**FeaturesPanel** — receives `features: Array<{ name, origin }>` from `state.traits`

**SpellsPanel** — receives `spellGroups: Array<{ level, label, spells, slots? }>` from `state.spellcasting`

### Design decisions

- **Components receive display-ready props, not raw `CharacterState`**. An adapter layer in the route transforms library types into simple component props. Components never import from `@dnd/library`.
- **Hybrid CSS approach**: Tailwind utilities for spacing, responsive, colors, typography. Small CSS file for decorative pseudo-elements and grid-template-areas. The mockup has 15+ `::before`/`::after` decorative elements that would be 300+ char class strings in pure Tailwind.
- **No external component library** (no shadcn/ui). The Tavern aesthetic is fully custom — parchment textures, wood-grain gradients, ember-glow buttons have no off-the-shelf equivalent.

---

## Phase 3: Character Sheet Route

**Goal**: Wire components to real `CharacterState` data via TanStack server functions.

### 3a. Server function — `app/src/routes/characters/-server.ts`

A `createServerFn` that:
1. Calls `getCharacterRuntimeState(characterId)` from the progression engine
2. Looks up campaign info (name, progressionMode)
3. Extracts class name, species, subclass from `state.sources` by filtering source kinds
4. Returns a `CharacterSheetData` type combining everything

### 3b. Data adapters — `app/src/routes/characters/-adapters.ts`

Pure functions that transform `CharacterSheetData` → component props:
- `toCharacterCardProps()`, `toAbilityScoreProps()`, `toCombatPanelProps()`, `toSkillsPanelProps()`, `toFeaturesPanelProps()`, `toSpellsPanelProps()`, `toXPBarProps()`

This is the boundary between the data model and view model.

### 3c. Route — `app/src/routes/characters/$characterId.tsx`

TanStack file-based route at `/characters/:characterId`. Uses a `loader` that calls the server function, then renders all components with adapter-transformed data. Includes `pendingComponent` (skeleton) and `errorComponent`.

### 3d. Page composition

```tsx
<TavernNav brandName="Hearthstone" activeTab="character" campaignName={...} />
<TavernLayout>
  <CharacterCard {...} />
  <XPProgressBar {...} />
  <AbilityScoreRow {...} />
  <ContentGrid>
    <CombatPanel {...} />
    <SkillsPanel {...} />
    <FeaturesPanel {...} />
    {spellcasting && <SpellsPanel {...} />}
  </ContentGrid>
</TavernLayout>
```

---

## Phase 4: Polish

- **Animations**: `fadeUp` with staggered `--delay` per component (matching mockup timings)
- **Responsive**: Mobile-first with Tailwind `md:` / `lg:` prefixes. Grid areas responsive overrides in tavern.css
- **Accessibility**: `role="progressbar"` on HP/XP bars, `aria-label` on ability cards, semantic nav structure, focus-visible styles
- **Loading state**: `CharacterSheetSkeleton` with `animate-pulse` in Tavern palette
- **Error state**: Themed error card for missing/failed character loads

---

## Implementation order

1. Phase 1 first (everything depends on theme tokens)
2. Phase 2 — build bottom-up: ui primitives → layout → character panels
3. Phase 3 — route + server function + adapters (can start once layout components exist)
4. Phase 4 — incremental polish

**~20 new files total**: 1 CSS, ~15 components, 1 route, 1 server function file, 1 adapters file, 1 skeleton

---

## Critical files to modify/reference

| File | Action |
|------|--------|
| `app/src/styles/app.css` | Add @theme tokens + global atmosphere CSS |
| `app/src/routes/__root.tsx` | Add Google Fonts links |
| `library/src/types/character.ts` | Reference only — CharacterState type contract |
| `app/src/server/progression/character-state.ts` | Reference — server function calls this |
| `design-exploration/option-c-tavern.html` | Source of truth for all CSS values |

## Verification

1. `pnpm -F @dnd/app dev` — app starts, homepage loads with Tavern body background + fonts
2. Navigate to `/characters/{id}` — character sheet renders with real data
3. Resize browser to tablet (768px) and mobile (480px) — layout reflows correctly
4. Chrome DevTools Lighthouse audit — no accessibility regressions
5. `pnpm check` — no type errors
6. `pnpm lint` — no lint errors
