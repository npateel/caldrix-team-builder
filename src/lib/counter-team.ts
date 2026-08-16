import { pokemon } from "@/db/schema";
import type { RosterEntry } from "@/server/team-roster";
import { ALL_TYPES, effectiveness, isWeakTo, type TypeName } from "./type-chart";

type PokemonRow = typeof pokemon.$inferSelect;

const OFFENSE_WEIGHT = 2;
const DEFENSE_WEIGHT = 2;
const SPEED_WEIGHT = 0.01;
const SYNERGY_WEIGHT = 1.5;

function offenseMultiplier(candidate: PokemonRow, enemy: PokemonRow): number {
  return Math.max(...candidate.types.map((atk) => effectiveness(atk, enemy.types)));
}

function incomingMultiplier(candidate: PokemonRow, enemy: PokemonRow): number {
  return Math.max(...enemy.types.map((atk) => effectiveness(atk, candidate.types)));
}

function synergyPenalty(candidateTypes: TypeName[], weaknessCounts: Map<TypeName, number>): number {
  let penalty = 0;
  for (const attackType of ALL_TYPES) {
    if (isWeakTo(candidateTypes, attackType)) {
      penalty += weaknessCounts.get(attackType) ?? 0;
    }
  }
  return penalty;
}

function recordWeaknesses(types: TypeName[], weaknessCounts: Map<TypeName, number>) {
  for (const attackType of ALL_TYPES) {
    if (isWeakTo(types, attackType)) {
      weaknessCounts.set(attackType, (weaknessCounts.get(attackType) ?? 0) + 1);
    }
  }
}

// Greedy heuristic, not a global optimum -- see the counter-team ADR/README
// notes. Slot 0 is pinned to the best individual counter for the enemy
// team's first pokemon (positional correspondence). The rest are picked one
// enemy at a time, preferring candidates that don't stack new shared
// weaknesses onto the counters already chosen.
export function generateCounterTeam(enemyRoster: RosterEntry[], candidatePool: PokemonRow[]): PokemonRow[] {
  const used = new Set<number>();
  const weaknessCounts = new Map<TypeName, number>();
  const result: PokemonRow[] = [];

  function pickBest(enemy: PokemonRow, applySynergy: boolean): PokemonRow | undefined {
    let best: PokemonRow | undefined;
    let bestScore = -Infinity;
    for (const candidate of candidatePool) {
      if (used.has(candidate.id)) continue;
      let score =
        offenseMultiplier(candidate, enemy) * OFFENSE_WEIGHT -
        incomingMultiplier(candidate, enemy) * DEFENSE_WEIGHT +
        (candidate.speed - enemy.speed) * SPEED_WEIGHT;
      if (applySynergy) score -= synergyPenalty(candidate.types, weaknessCounts) * SYNERGY_WEIGHT;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }

  enemyRoster.forEach((entry, index) => {
    const pick = pickBest(entry.pokemon, index > 0);
    if (!pick) return;
    used.add(pick.id);
    recordWeaknesses(pick.types, weaknessCounts);
    result.push(pick);
  });

  return result;
}
