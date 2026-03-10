CREATE TYPE "audience_kind" AS ENUM('dm-only', 'party', 'character');--> statement-breakpoint
CREATE TYPE "communication_event_type" AS ENUM('created', 'edited', 'scheduled', 'published', 'audience-changed', 'pinned', 'unpinned', 'archived');--> statement-breakpoint
CREATE TYPE "communication_kind" AS ENUM('message', 'handout', 'rule-callout');--> statement-breakpoint
CREATE TYPE "communication_ref_type" AS ENUM('spell', 'feat', 'feature', 'item', 'rule', 'condition', 'character', 'location');--> statement-breakpoint
CREATE TYPE "communication_state" AS ENUM('draft', 'scheduled', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "communication_events" (
	"id" text PRIMARY KEY,
	"item_id" text NOT NULL,
	"event_type" "communication_event_type" NOT NULL,
	"actor_label" text NOT NULL,
	"payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_items" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"session_id" text,
	"kind" "communication_kind" NOT NULL,
	"state" "communication_state" DEFAULT 'draft'::"communication_state" NOT NULL,
	"audience_kind" "audience_kind" DEFAULT 'dm-only'::"audience_kind" NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body_md" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"pinned_at" timestamp with time zone,
	"pin_rank" integer,
	"created_by_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "communication_items_title_nonempty" CHECK (char_length("title") > 0),
	CONSTRAINT "communication_items_body_nonempty" CHECK (char_length("body_md") > 0),
	CONSTRAINT "communication_items_pin_rank_nonnegative" CHECK ("pin_rank" is null or "pin_rank" >= 0)
);
--> statement-breakpoint
CREATE TABLE "communication_refs" (
	"id" text PRIMARY KEY,
	"item_id" text NOT NULL,
	"ref_type" "communication_ref_type" NOT NULL,
	"ref_id" text NOT NULL,
	"ref_pack_id" text,
	"label_override" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "communication_refs_sort_order_nonnegative" CHECK ("sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "communication_targets" (
	"id" text PRIMARY KEY,
	"item_id" text NOT NULL,
	"character_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "communication_events_item_idx" ON "communication_events" ("item_id");--> statement-breakpoint
CREATE INDEX "communication_events_created_at_idx" ON "communication_events" ("created_at");--> statement-breakpoint
CREATE INDEX "communication_items_campaign_idx" ON "communication_items" ("campaign_id");--> statement-breakpoint
CREATE INDEX "communication_items_campaign_state_idx" ON "communication_items" ("campaign_id","state");--> statement-breakpoint
CREATE INDEX "communication_items_session_idx" ON "communication_items" ("session_id");--> statement-breakpoint
CREATE INDEX "communication_items_pin_rank_idx" ON "communication_items" ("pin_rank");--> statement-breakpoint
CREATE INDEX "communication_items_published_at_idx" ON "communication_items" ("published_at");--> statement-breakpoint
CREATE INDEX "communication_refs_item_idx" ON "communication_refs" ("item_id");--> statement-breakpoint
CREATE INDEX "communication_refs_pack_ref_idx" ON "communication_refs" ("ref_pack_id","ref_id");--> statement-breakpoint
CREATE INDEX "communication_targets_item_idx" ON "communication_targets" ("item_id");--> statement-breakpoint
CREATE INDEX "communication_targets_character_idx" ON "communication_targets" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "communication_targets_item_character_uidx" ON "communication_targets" ("item_id","character_id");--> statement-breakpoint
ALTER TABLE "communication_events" ADD CONSTRAINT "communication_events_item_id_communication_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "communication_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_refs" ADD CONSTRAINT "communication_refs_item_id_communication_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "communication_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_targets" ADD CONSTRAINT "communication_targets_item_id_communication_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "communication_items"("id") ON DELETE CASCADE;