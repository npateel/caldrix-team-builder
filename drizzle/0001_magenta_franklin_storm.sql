CREATE TYPE "public"."change_entity_type" AS ENUM('pokemon', 'move');--> statement-breakpoint
CREATE TYPE "public"."move_damage_class" AS ENUM('status', 'physical', 'special');--> statement-breakpoint
CREATE TYPE "public"."type_enum" AS ENUM('normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy', 'stellar', 'unknown');--> statement-breakpoint
CREATE TABLE "changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "change_entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "type_enum" NOT NULL,
	"power" smallint,
	"damage_class" "move_damage_class" NOT NULL,
	"last_fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sprite_url" text,
	"types" "type_enum"[] NOT NULL,
	"hp" smallint NOT NULL,
	"attack" smallint NOT NULL,
	"defense" smallint NOT NULL,
	"special_attack" smallint NOT NULL,
	"special_defense" smallint NOT NULL,
	"speed" smallint NOT NULL,
	"last_fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_moves" (
	"pokemon_id" integer NOT NULL,
	"move_id" integer NOT NULL,
	CONSTRAINT "pokemon_moves_pokemon_id_move_id_pk" PRIMARY KEY("pokemon_id","move_id")
);
--> statement-breakpoint
CREATE TABLE "team_pokemon" (
	"team_id" uuid NOT NULL,
	"pokemon_id" integer NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "team_pokemon_team_id_position_pk" PRIMARY KEY("team_id","position")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "pokemon_moves" ADD CONSTRAINT "pokemon_moves_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_moves" ADD CONSTRAINT "pokemon_moves_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_pokemon" ADD CONSTRAINT "team_pokemon_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_pokemon" ADD CONSTRAINT "team_pokemon_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "description";