CREATE TYPE "equipment_slot" AS ENUM('armor', 'main-hand', 'off-hand', 'two-hand', 'ammunition', 'worn', 'carried', 'stowed');--> statement-breakpoint
CREATE TYPE "skill_choice_source" AS ENUM('class', 'background', 'species', 'feat', 'aa-purchase', 'other');--> statement-breakpoint
CREATE TABLE "character_equipment" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"item_entity_id" text NOT NULL,
	"item_pack_id" text,
	"item_label" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"equipped" boolean DEFAULT false NOT NULL,
	"slot" "equipment_slot",
	"state_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_equipment_item_label_nonempty" CHECK (char_length("item_label") > 0),
	CONSTRAINT "character_equipment_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "character_feat_choices" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"feat_entity_id" text NOT NULL,
	"feat_pack_id" text,
	"feat_label" text NOT NULL,
	"sub_choices_json" jsonb,
	"source_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_feat_choices_feat_label_nonempty" CHECK (char_length("feat_label") > 0),
	CONSTRAINT "character_feat_choices_source_label_nonempty" CHECK (char_length("source_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "character_metamagic_choices" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"metamagic_option" text NOT NULL,
	"source_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_metamagic_choices_option_nonempty" CHECK (char_length("metamagic_option") > 0),
	CONSTRAINT "character_metamagic_choices_source_label_nonempty" CHECK (char_length("source_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "character_pact_blade_bonds" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"weapon_entity_id" text,
	"weapon_pack_id" text,
	"weapon_label" text NOT NULL,
	"is_magic_weapon" boolean DEFAULT false NOT NULL,
	"bonded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unbonded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_pact_blade_bonds_weapon_label_nonempty" CHECK (char_length("weapon_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "character_skill_choices" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"skill_name" text NOT NULL,
	"source" "skill_choice_source" NOT NULL,
	"source_label" text NOT NULL,
	"has_expertise" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_skill_choices_skill_name_nonempty" CHECK (char_length("skill_name") > 0),
	CONSTRAINT "character_skill_choices_source_label_nonempty" CHECK (char_length("source_label") > 0)
);
--> statement-breakpoint
CREATE TABLE "character_weapon_masteries" (
	"id" text PRIMARY KEY,
	"character_id" text NOT NULL,
	"weapon_entity_id" text NOT NULL,
	"weapon_pack_id" text,
	"weapon_label" text NOT NULL,
	"mastery_property" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_weapon_masteries_weapon_label_nonempty" CHECK (char_length("weapon_label") > 0),
	CONSTRAINT "character_weapon_masteries_mastery_property_nonempty" CHECK (char_length("mastery_property") > 0)
);
--> statement-breakpoint
CREATE INDEX "character_equipment_character_idx" ON "character_equipment" ("character_id");--> statement-breakpoint
CREATE INDEX "character_equipment_item_entity_idx" ON "character_equipment" ("item_entity_id");--> statement-breakpoint
CREATE INDEX "character_feat_choices_character_idx" ON "character_feat_choices" ("character_id");--> statement-breakpoint
CREATE INDEX "character_feat_choices_feat_entity_idx" ON "character_feat_choices" ("feat_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_feat_choices_character_feat_uidx" ON "character_feat_choices" ("character_id","feat_entity_id");--> statement-breakpoint
CREATE INDEX "character_metamagic_choices_character_idx" ON "character_metamagic_choices" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_metamagic_choices_character_option_uidx" ON "character_metamagic_choices" ("character_id","metamagic_option");--> statement-breakpoint
CREATE INDEX "character_pact_blade_bonds_character_idx" ON "character_pact_blade_bonds" ("character_id");--> statement-breakpoint
CREATE INDEX "character_skill_choices_character_idx" ON "character_skill_choices" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_skill_choices_character_skill_uidx" ON "character_skill_choices" ("character_id","skill_name");--> statement-breakpoint
CREATE INDEX "character_weapon_masteries_character_idx" ON "character_weapon_masteries" ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_weapon_masteries_character_weapon_uidx" ON "character_weapon_masteries" ("character_id","weapon_entity_id");--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_feat_choices" ADD CONSTRAINT "character_feat_choices_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_metamagic_choices" ADD CONSTRAINT "character_metamagic_choices_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_pact_blade_bonds" ADD CONSTRAINT "character_pact_blade_bonds_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_skill_choices" ADD CONSTRAINT "character_skill_choices_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_weapon_masteries" ADD CONSTRAINT "character_weapon_masteries_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;