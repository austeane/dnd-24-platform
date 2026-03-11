CREATE TYPE "hit_point_event_kind" AS ENUM('damage', 'heal', 'temp-gain', 'temp-replace', 'temp-clear', 'long-rest-reset');--> statement-breakpoint
CREATE TABLE "character_hit_points" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"current_hp" integer NOT NULL,
	"temp_hp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_hit_points_current_hp_nonnegative" CHECK ("current_hp" >= 0),
	CONSTRAINT "character_hit_points_temp_hp_nonnegative" CHECK ("temp_hp" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hit_point_events" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"session_id" text,
	"event_kind" "hit_point_event_kind" NOT NULL,
	"previous_current_hp" integer NOT NULL,
	"new_current_hp" integer NOT NULL,
	"previous_temp_hp" integer NOT NULL,
	"new_temp_hp" integer NOT NULL,
	"note" text,
	"created_by_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hit_point_events_previous_current_hp_nonnegative" CHECK ("previous_current_hp" >= 0),
	CONSTRAINT "hit_point_events_new_current_hp_nonnegative" CHECK ("new_current_hp" >= 0),
	CONSTRAINT "hit_point_events_previous_temp_hp_nonnegative" CHECK ("previous_temp_hp" >= 0),
	CONSTRAINT "hit_point_events_new_temp_hp_nonnegative" CHECK ("new_temp_hp" >= 0),
	CONSTRAINT "hit_point_events_created_by_label_nonempty" CHECK (char_length("created_by_label") > 0)
);
--> statement-breakpoint
CREATE INDEX "character_hit_points_character_idx" ON "character_hit_points" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_hit_points_character_uidx" ON "character_hit_points" ("character_id");--> statement-breakpoint
CREATE INDEX "hit_point_events_character_idx" ON "hit_point_events" ("character_id");--> statement-breakpoint
CREATE INDEX "hit_point_events_session_idx" ON "hit_point_events" ("session_id");--> statement-breakpoint
CREATE INDEX "hit_point_events_kind_idx" ON "hit_point_events" ("event_kind");--> statement-breakpoint
ALTER TABLE "character_hit_points" ADD CONSTRAINT "character_hit_points_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hit_point_events" ADD CONSTRAINT "hit_point_events_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hit_point_events" ADD CONSTRAINT "hit_point_events_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;