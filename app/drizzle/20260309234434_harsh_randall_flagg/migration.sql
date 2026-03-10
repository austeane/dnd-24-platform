CREATE TYPE "leveling_method" AS ENUM('standard-xp', 'milestone', 'fixed-cost', 'aa-formula');--> statement-breakpoint
CREATE TYPE "progression_mode" AS ENUM('aa-only', 'hybrid', 'standard');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"progression_mode" "progression_mode" DEFAULT 'hybrid'::"progression_mode" NOT NULL,
	"leveling_method" "leveling_method" DEFAULT 'fixed-cost'::"leveling_method" NOT NULL,
	"enabled_pack_ids" jsonb DEFAULT '["srd-5e-2024"]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_slug_nonempty" CHECK (char_length("slug") > 0),
	CONSTRAINT "campaigns_name_nonempty" CHECK (char_length("name") > 0),
	CONSTRAINT "campaigns_enabled_pack_ids_is_array" CHECK (jsonb_typeof("enabled_pack_ids") = 'array'),
	CONSTRAINT "campaigns_enabled_pack_ids_nonempty" CHECK (jsonb_array_length("enabled_pack_ids") > 0)
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"owner_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_slug_nonempty" CHECK (char_length("slug") > 0),
	CONSTRAINT "characters_name_nonempty" CHECK (char_length("name") > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"session_number" integer NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"recap_md" text,
	"dm_notes_md" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_title_nonempty" CHECK (char_length("title") > 0),
	CONSTRAINT "sessions_number_positive" CHECK ("session_number" > 0),
	CONSTRAINT "sessions_ended_at_after_starts_at" CHECK ("ended_at" is null or "starts_at" is null or "ended_at" >= "starts_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_uidx" ON "campaigns" ("slug");--> statement-breakpoint
CREATE INDEX "campaigns_progression_mode_idx" ON "campaigns" ("progression_mode");--> statement-breakpoint
CREATE INDEX "characters_campaign_idx" ON "characters" ("campaign_id");--> statement-breakpoint
CREATE INDEX "characters_owner_label_idx" ON "characters" ("owner_label");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_campaign_slug_uidx" ON "characters" ("campaign_id","slug");--> statement-breakpoint
CREATE INDEX "sessions_campaign_idx" ON "sessions" ("campaign_id");--> statement-breakpoint
CREATE INDEX "sessions_campaign_starts_at_idx" ON "sessions" ("campaign_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_campaign_number_uidx" ON "sessions" ("campaign_id","session_number");--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "communication_targets" ADD CONSTRAINT "communication_targets_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_scheduled_requires_timestamp" CHECK ("state" <> 'scheduled' or "scheduled_for" is not null);--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_published_requires_timestamp" CHECK ("state" <> 'published' or "published_at" is not null);--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_archived_requires_timestamp" CHECK ("state" <> 'archived' or "archived_at" is not null);--> statement-breakpoint
ALTER TABLE "communication_items" ADD CONSTRAINT "communication_items_pin_fields_require_published" CHECK (("pinned_at" is null and "pin_rank" is null) or "state" = 'published');