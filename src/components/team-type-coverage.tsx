import { defensiveCoverage, offensiveCoverage } from "@/lib/team-coverage";
import { POKEMON_TYPE_NAMES, TYPE_COLORS } from "@/lib/type-colors";
import type { RosterEntry } from "@/server/team-roster";

export function TeamTypeCoverage({ roster }: { roster: RosterEntry[] }) {
  if (roster.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Add pokémon to see type coverage.</p>;
  }

  const teamTypes = roster.map((entry) => entry.pokemon.types);
  const defensive = [...defensiveCoverage(teamTypes)].sort((a, b) => b.weak - a.weak);
  const covered = offensiveCoverage(teamTypes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Defensive coverage <span className="font-normal">-- which types threaten your team</span>
        </h3>
        <div className="flex flex-col gap-1.5">
          {defensive.map((row) => (
            <div key={row.type} className="flex items-center gap-3 text-xs">
              <span
                className="w-20 shrink-0 rounded-full px-2 py-0.5 text-center font-medium capitalize text-white"
                style={{ backgroundColor: TYPE_COLORS[row.type] }}
              >
                {row.type}
              </span>
              <Dots count={row.weak} colorClass="bg-red-500" label="weak" />
              <Dots count={row.resist} colorClass="bg-emerald-500" label="resist" />
              <Dots count={row.immune} colorClass="bg-blue-500" label="immune" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Offensive coverage <span className="font-normal">-- types your team hits super-effectively</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {POKEMON_TYPE_NAMES.map((type) => (
            <span
              key={type}
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize text-white ${
                covered.has(type) ? "" : "opacity-25"
              }`}
              style={{ backgroundColor: TYPE_COLORS[type] }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dots({ count, colorClass, label }: { count: number; colorClass: string; label: string }) {
  return (
    <span className="flex w-16 items-center gap-0.5" title={count > 0 ? `${count} ${label}` : undefined}>
      {count === 0 ? (
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
      ) : (
        Array.from({ length: count }).map((_, i) => <span key={i} className={`h-2 w-2 rounded-full ${colorClass}`} />)
      )}
    </span>
  );
}
