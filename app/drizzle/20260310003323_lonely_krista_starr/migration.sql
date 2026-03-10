CREATE TYPE "character_source_kind" AS ENUM('class-level', 'class-feature', 'subclass-feature', 'species', 'background', 'feat', 'aa-purchase', 'magic-item', 'equipment', 'condition', 'override');--> statement-breakpoint
CREATE TYPE "character_spend_plan_kind" AS ENUM('level-up', 'aa-purchase', 'mixed', 'respec');--> statement-breakpoint
CREATE TYPE "character_spend_plan_state" AS ENUM('draft', 'committed', 'abandoned');--> statement-breakpoint
CREATE TYPE "xp_transaction_category" AS ENUM('award', 'spend-aa', 'spend-level', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "character_sources" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"source_kind" "character_source_kind" NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_pack_id" text,
	"label" text NOT NULL,
	"rank" integer DEFAULT 1 NOT NULL,
	"payload_json" jsonb,
	"suppressed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_sources_label_nonempty" CHECK (char_length("label") > 0),
	CONSTRAINT "character_sources_rank_positive" CHECK ("rank" > 0)
);
--> statement-breakpoint
CREATE TABLE "character_spend_plans" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"character_id" text NOT NULL,
	"session_id" text,
	"state" "character_spend_plan_state" DEFAULT 'draft'::"character_spend_plan_state" NOT NULL,
	"kind" "character_spend_plan_kind" NOT NULL,
	"summary" text NOT NULL,
	"notes" text,
	"total_xp_cost" integer DEFAULT 0 NOT NULL,
	"plan_json" jsonb NOT NULL,
	"created_by_label" text NOT NULL,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_spend_plans_summary_nonempty" CHECK (char_length("summary") > 0),
	CONSTRAINT "character_spend_plans_total_xp_cost_nonnegative" CHECK ("total_xp_cost" >= 0),
	CONSTRAINT "character_spend_plans_committed_requires_timestamp" CHECK ("state" <> 'committed' or "committed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"character_id" text NOT NULL,
	"session_id" text,
	"category" "xp_transaction_category" NOT NULL,
	"amount" integer NOT NULL,
	"note" text NOT NULL,
	"created_by_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "xp_transactions_note_nonempty" CHECK (char_length("note") > 0),
	CONSTRAINT "xp_transactions_amount_nonzero" CHECK ("amount" <> 0)
);
--> statement-breakpoint
CREATE INDEX "character_sources_character_idx" ON "character_sources" ("character_id");--> statement-breakpoint
CREATE INDEX "character_sources_pack_entity_idx" ON "character_sources" ("source_pack_id","source_entity_id");--> statement-breakpoint
CREATE INDEX "character_sources_kind_idx" ON "character_sources" ("source_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "character_sources_character_kind_entity_rank_uidx" ON "character_sources" ("character_id","source_kind","source_entity_id","rank");--> statement-breakpoint
CREATE INDEX "character_spend_plans_campaign_state_idx" ON "character_spend_plans" ("campaign_id","state");--> statement-breakpoint
CREATE INDEX "character_spend_plans_character_state_idx" ON "character_spend_plans" ("character_id","state");--> statement-breakpoint
CREATE INDEX "character_spend_plans_session_idx" ON "character_spend_plans" ("session_id");--> statement-breakpoint
CREATE INDEX "xp_transactions_campaign_idx" ON "xp_transactions" ("campaign_id");--> statement-breakpoint
CREATE INDEX "xp_transactions_character_idx" ON "xp_transactions" ("character_id");--> statement-breakpoint
CREATE INDEX "xp_transactions_session_idx" ON "xp_transactions" ("session_id");--> statement-breakpoint
CREATE INDEX "xp_transactions_category_idx" ON "xp_transactions" ("category");--> statement-breakpoint
ALTER TABLE "character_sources" ADD CONSTRAINT "character_sources_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_spend_plans" ADD CONSTRAINT "character_spend_plans_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_spend_plans" ADD CONSTRAINT "character_spend_plans_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_spend_plans" ADD CONSTRAINT "character_spend_plans_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL;