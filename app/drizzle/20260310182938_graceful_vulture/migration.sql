CREATE TYPE "condition_event_kind" AS ENUM('apply', 'remove', 'override');--> statement-breakpoint
CREATE TYPE "condition_name" AS ENUM('charmed', 'incapacitated');--> statement-breakpoint
CREATE TYPE "resource_event_kind" AS ENUM('spend', 'restore', 'short-rest-reset', 'long-rest-reset');--> statement-breakpoint
CREATE TYPE "rest_type" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TABLE "character_conditions" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"condition_name" "condition_name" NOT NULL,
	"source_creature" text,
	"note" text,
	"applied_by_label" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_by_label" text,
	"removed_at" timestamp with time zone,
	CONSTRAINT "character_conditions_applied_by_label_nonempty" CHECK (char_length("applied_by_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "character_resource_pools" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"resource_name" text NOT NULL,
	"current_uses" integer NOT NULL,
	"max_uses" integer NOT NULL,
	"reset_on" "rest_type" NOT NULL,
	"source_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_resource_pools_resource_name_nonempty" CHECK (char_length("resource_name") > 0),
	CONSTRAINT "character_resource_pools_max_uses_positive" CHECK ("max_uses" > 0),
	CONSTRAINT "character_resource_pools_current_uses_nonnegative" CHECK ("current_uses" >= 0),
	CONSTRAINT "character_resource_pools_current_lte_max" CHECK ("current_uses" <= "max_uses"),
	CONSTRAINT "character_resource_pools_source_name_nonempty" CHECK (char_length("source_name") > 0)
);
--> statement-breakpoint
CREATE TABLE "condition_events" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"session_id" text,
	"condition_id" text NOT NULL,
	"event_kind" "condition_event_kind" NOT NULL,
	"condition_name" "condition_name" NOT NULL,
	"note" text,
	"created_by_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "condition_events_created_by_label_nonempty" CHECK (char_length("created_by_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "resource_events" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"session_id" text,
	"event_kind" "resource_event_kind" NOT NULL,
	"changes_json" jsonb NOT NULL,
	"note" text,
	"created_by_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_events_created_by_label_nonempty" CHECK (char_length("created_by_label") > 0)
);
--> statement-breakpoint
CREATE INDEX "character_conditions_character_idx" ON "character_conditions" ("character_id");--> statement-breakpoint
CREATE INDEX "character_conditions_active_idx" ON "character_conditions" ("character_id","condition_name");--> statement-breakpoint
CREATE INDEX "character_resource_pools_character_idx" ON "character_resource_pools" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_resource_pools_character_resource_uidx" ON "character_resource_pools" ("character_id","resource_name");--> statement-breakpoint
CREATE INDEX "condition_events_character_idx" ON "condition_events" ("character_id");--> statement-breakpoint
CREATE INDEX "condition_events_session_idx" ON "condition_events" ("session_id");--> statement-breakpoint
CREATE INDEX "condition_events_condition_idx" ON "condition_events" ("condition_id");--> statement-breakpoint
CREATE INDEX "condition_events_kind_idx" ON "condition_events" ("event_kind");--> statement-breakpoint
CREATE INDEX "resource_events_character_idx" ON "resource_events" ("character_id");--> statement-breakpoint
CREATE INDEX "resource_events_session_idx" ON "resource_events" ("session_id");--> statement-breakpoint
CREATE INDEX "resource_events_kind_idx" ON "resource_events" ("event_kind");--> statement-breakpoint
ALTER TABLE "character_conditions" ADD CONSTRAINT "character_conditions_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_resource_pools" ADD CONSTRAINT "character_resource_pools_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "condition_events" ADD CONSTRAINT "condition_events_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "condition_events" ADD CONSTRAINT "condition_events_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "condition_events" ADD CONSTRAINT "condition_events_condition_id_character_conditions_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "character_conditions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resource_events" ADD CONSTRAINT "resource_events_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resource_events" ADD CONSTRAINT "resource_events_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;