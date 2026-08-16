import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

// name/email/emailVerified/image are unused for anonymous (cookie-based)
// users -- populated once someone signs in via OAuth (see src/auth.ts).
// isAdmin gates /admin (see adr-006) -- no self-serve way to set it, flip it
// by hand (db:studio or a one-off update) for whoever needs access.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Schema below matches what @auth/drizzle-adapter expects to find on tables
// named users/accounts/sessions/verificationTokens. Session strategy is JWT
// (see src/auth.ts), so `sessions` isn't actively read/written, but the
// adapter still expects the table to exist.
// @auth/drizzle-adapter's Postgres accounts table type expects these exact
// (snake_case) object keys, not just matching db column names -- it reads
// e.g. account.refresh_token, not account.refreshToken.
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

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
    // Stamped to `now` on every roster PUT, for every pokemon in the new
    // list (see buildRosterRows in team-roster.ts) -- tracks the last
    // time this team's roster was saved with this pokemon on it, not the
    // first time it ever joined. Used to scope Task 2's change alerts to
    // changes detected after that save, not changes from before. See
    // adr-008.
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
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
