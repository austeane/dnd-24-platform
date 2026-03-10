CREATE TYPE "access_credential_role" AS ENUM('dm', 'player');--> statement-breakpoint
CREATE TABLE "access_credentials" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"role" "access_credential_role" NOT NULL,
	"character_id" text,
	"scope_key" text NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"password_hint" text,
	"version" integer DEFAULT 1 NOT NULL,
	"set_by_label" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_credentials_scope_key_nonempty" CHECK (char_length("scope_key") > 0),
	CONSTRAINT "access_credentials_password_hash_nonempty" CHECK (char_length("password_hash") > 0),
	CONSTRAINT "access_credentials_password_salt_nonempty" CHECK (char_length("password_salt") > 0),
	CONSTRAINT "access_credentials_set_by_label_nonempty" CHECK (char_length("set_by_label") > 0),
	CONSTRAINT "access_credentials_version_positive" CHECK ("version" > 0),
	CONSTRAINT "access_credentials_scope_matches_role" CHECK ((
        "role" = 'dm'
        and "character_id" is null
        and "scope_key" = 'dm'
      ) or (
        "role" = 'player'
        and "character_id" is not null
        and "scope_key" = ('character:' || "character_id")
      ))
);
--> statement-breakpoint
CREATE TABLE "access_sessions" (
	"id" text PRIMARY KEY,
	"campaign_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"role" "access_credential_role" NOT NULL,
	"character_id" text,
	"token_hash" text NOT NULL,
	"session_label" text,
	"created_by_label" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_sessions_token_hash_nonempty" CHECK (char_length("token_hash") > 0),
	CONSTRAINT "access_sessions_created_by_label_nonempty" CHECK (char_length("created_by_label") > 0),
	CONSTRAINT "access_sessions_role_matches_scope" CHECK ((
        "role" = 'dm'
        and "character_id" is null
      ) or (
        "role" = 'player'
        and "character_id" is not null
      ))
);
--> statement-breakpoint
CREATE INDEX "access_credentials_campaign_idx" ON "access_credentials" ("campaign_id");--> statement-breakpoint
CREATE INDEX "access_credentials_character_idx" ON "access_credentials" ("character_id");--> statement-breakpoint
CREATE INDEX "access_credentials_role_idx" ON "access_credentials" ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "access_credentials_campaign_scope_uidx" ON "access_credentials" ("campaign_id","scope_key");--> statement-breakpoint
CREATE INDEX "access_sessions_campaign_idx" ON "access_sessions" ("campaign_id");--> statement-breakpoint
CREATE INDEX "access_sessions_credential_idx" ON "access_sessions" ("credential_id");--> statement-breakpoint
CREATE INDEX "access_sessions_character_idx" ON "access_sessions" ("character_id");--> statement-breakpoint
CREATE INDEX "access_sessions_role_idx" ON "access_sessions" ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "access_sessions_token_hash_uidx" ON "access_sessions" ("token_hash");--> statement-breakpoint
ALTER TABLE "access_credentials" ADD CONSTRAINT "access_credentials_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "access_credentials" ADD CONSTRAINT "access_credentials_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "access_sessions" ADD CONSTRAINT "access_sessions_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "access_sessions" ADD CONSTRAINT "access_sessions_credential_id_access_credentials_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "access_credentials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "access_sessions" ADD CONSTRAINT "access_sessions_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;