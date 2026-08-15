import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// neon-serverless uses a WebSocket connection (not the neon-http single-shot
// driver), which is what gives us db.transaction() support -- needed for the
// roster-replace endpoint's delete+insert to be atomic.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.POKEDEX_DATABASE_URL! });
export const db = drizzle(pool, { schema });
