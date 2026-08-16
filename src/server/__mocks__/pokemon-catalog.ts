import { vi } from "vitest";

// getAllPokemon wraps its query in unstable_cache, which throws outside a
// real Next.js server runtime (no incremental cache available under
// vitest) -- mocked here for the same reason @/db is, not to dodge testing
// real logic.
export const getAllPokemon = vi.fn(async (): Promise<unknown[]> => []);
