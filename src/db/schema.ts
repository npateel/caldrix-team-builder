import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Primary key is the PokéAPI id itself (not a generated uuid) -- these rows
// are a cache of an external source of truth, not app-owned entities.

export const typeEnum = pgEnum("type_enum", [
  "normal", "fighting", "flying", "poison", "ground",
  "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric",
  "psychic", "ice", "dragon", "dark", "fairy", "stellar", "unknown", "shadow"
])

export const pokemon = pgTable("pokemon", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  spriteUrl: text("sprite_url"),
  types: typeEnum("types").array().notNull(),
  hp: smallint("hp").notNull(),
  attack: smallint("attack").notNull(),
  defense: smallint("defense").notNull(),
  specialAttack: smallint("special_attack").notNull(),
  specialDefense: smallint("special_defense").notNull(),
  speed: smallint("speed").notNull(),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moveDamageClass = pgEnum("move_damage_class", ["status", "physical", "special"])

export const moves = pgTable("moves", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: typeEnum("type").notNull(),
  power: smallint("power"),
  damageClass: moveDamageClass("damage_class").notNull(),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pokemonMoves = pgTable(
  "pokemon_moves",
  {
    pokemonId: integer("pokemon_id")
      .notNull()
      .references(() => pokemon.id, { onDelete: "cascade" }),
    moveId: integer("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.pokemonId, table.moveId] })],
);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// position (0-5) is both the ordering and the 6-slot cap; primary key on
// (teamId, position) means a slot can only be occupied once per team.
export const teamPokemon = pgTable(
  "team_pokemon",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    pokemonId: integer("pokemon_id")
      .notNull()
      .references(() => pokemon.id),
    position: smallint("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.position] })],
);

export const changeEntityType = pgEnum("change_entity_type", ["pokemon", "move"]);

// entityId intentionally has no FK -- it points into either pokemon or moves
// depending on entityType, so it can't be a single foreign key.
export const changes = pgTable("changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: changeEntityType("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});
