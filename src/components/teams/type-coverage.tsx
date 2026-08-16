import { defensiveCoverage, offensiveCoverage } from "@/lib/team-coverage";
import { POKEMON_TYPE_NAMES } from "@/lib/type-colors";
import type { RosterEntry } from "@/server/team-roster";
import { TypeBadge } from "../type-badge";

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
              <TypeBadge type={row.type} size="md" className="w-20 shrink-0 text-center" />
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
            <TypeBadge key={type} type={type} size="lg" className={covered.has(type) ? "" : "opacity-25"} />
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
