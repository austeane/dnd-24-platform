# Plan 008: DM Communication Surface

## Goal

Give the DM a focused way to communicate what players should know right now, without making them run a separate wiki, notes app, or chat thread.

This is not a general CMS. It is a game-running communication layer.

## Data Model

The first implementation should use one core content table plus three supporting tables.

### Enums

```ts
type CommunicationKind = "message" | "handout" | "rule-callout";
type CommunicationState = "draft" | "scheduled" | "published" | "archived";
type AudienceKind = "dm-only" | "party" | "character";
type CommunicationEventType =
  | "created"
  | "edited"
  | "scheduled"
  | "published"
  | "audience-changed"
  | "pinned"
  | "unpinned"
  | "archived";
```

### `communication_items`

One row per DM-authored item.

```ts
interface CommunicationItemRecord {
  id: string;
  campaignId: string;
  sessionId: string | null;
  kind: CommunicationKind;
  state: CommunicationState;
  audienceKind: AudienceKind;
  title: string;
  summary: string | null;
  bodyMd: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  pinnedAt: string | null;
  pinRank: number | null;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
}
```

Notes:

- `message` is for short session-use updates.
- `handout` is for richer revealable content.
- `rule-callout` is for short rules reminders that usually point at compendium entries.
- `summary` is what player list views show before opening the full item.
- `pinRank` controls player-surface ordering when multiple items are pinned.

### `communication_targets`

Target rows only exist when `audienceKind === "character"`.

```ts
interface CommunicationTargetRecord {
  id: string;
  itemId: string;
  characterId: string;
  createdAt: string;
}
```

### `communication_refs`

Links a communication item to rules content, characters, or campaign objects.

```ts
interface CommunicationRefRecord {
  id: string;
  itemId: string;
  refType:
    | "spell"
    | "feat"
    | "feature"
    | "item"
    | "rule"
    | "condition"
    | "character"
    | "location";
  refId: string;
  refPackId: string | null;
  labelOverride: string | null;
  sortOrder: number;
}
```

This is where pack-aware references matter. A `rule-callout` can point at base SRD content or AA content without duplicating the rules text.

### `communication_events`

Append-only audit trail for reveal and visibility changes.

```ts
interface CommunicationEventRecord {
  id: string;
  itemId: string;
  eventType: CommunicationEventType;
  actorLabel: string;
  payloadJson: string | null;
  createdAt: string;
}
```

`payloadJson` stores event details such as old/new audience, old/new pin rank, or the publish timestamp.

## Invariants

1. `draft` items are DM-visible only.
2. `scheduled` items require `scheduledFor`.
3. `published` items require `publishedAt`.
4. `archived` items require `archivedAt` and never appear on player surfaces.
5. `audienceKind === "character"` requires at least one `communication_targets` row.
6. `pinnedAt` and `pinRank` are only valid for `published` items.
7. Every publish, unpublish, audience change, pin, unpin, and archive writes a `communication_events` row.

## Read Models

### Player Card

This is the shape the player UI should read, already filtered for visibility.

```ts
interface PlayerCommunicationCard {
  id: string;
  kind: CommunicationKind;
  title: string;
  summary: string | null;
  bodyMd: string;
  isPinned: boolean;
  publishedAt: string;
  refs: Array<{
    refType: string;
    refId: string;
    refPackId: string | null;
    label: string;
  }>;
}
```

### DM Board Item

This is the shape for the DM communication board.

```ts
interface DmCommunicationBoardItem {
  id: string;
  kind: CommunicationKind;
  state: CommunicationState;
  audienceKind: AudienceKind;
  title: string;
  sessionId: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  pinnedAt: string | null;
  targetCharacterIds: string[];
}
```

## Query Rules

The first version only needs a few core queries:

- `listDmCommunicationBoard(campaignId)`
- `listVisibleCommunication(campaignId, characterId | null)`
- `getCommunicationItemForDm(itemId)`
- `getCommunicationItemForPlayer(itemId, characterId | null)`

Player queries return only:

- `published` items
- items with `audienceKind === "party"`
- items with `audienceKind === "character"` and a matching target row
- items ordered by `pinRank`, then `publishedAt desc`

## Command Surface

The first write API only needs these commands:

- `createCommunicationDraft`
- `editCommunicationDraft`
- `scheduleCommunication`
- `publishCommunicationNow`
- `changeCommunicationAudience`
- `pinCommunication`
- `unpinCommunication`
- `archiveCommunication`

Each command writes the current-row change plus one `communication_events` row.

## Scope Boundary

In scope:

- Session reminders
- Reveals
- Handouts
- Rules callouts
- Character-targeted notes
- Visibility controls

Out of scope for this phase:

- Full collaborative wiki
- Rich document publishing
- Long-form worldbuilding CMS
- Generic note-taking system

## Design Rules

1. Favor fast session use over rich editing.
2. Reuse compendium references instead of duplicating rule text.
3. Visibility must be explicit and testable.
4. Player surfaces should show only what is relevant now.
5. DM should be able to answer: "What have I told the players already?"

## Exit Criteria

This surface is in place when:

- The DM can run a session using in-app pins, reveals, and updates.
- Players can find current instructions and revealed information without asking for repeated clarification.
- The visibility model is reliable enough that the DM trusts it with private information.
