import { activateProps } from "@/lib/activate-props";
import { HIGHEST_STAT_CLASSES, highestStatKeys, type PokemonCardData, type StatKey } from "@/lib/pokemon-stats";
import { TypeBadge } from "../type-badge";

const STATS: { key: StatKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Atk" },
  { key: "defense", label: "Def" },
  { key: "specialAttack", label: "SpA" },
  { key: "specialDefense", label: "SpD" },
  { key: "speed", label: "Spe" },
];

export function PokemonCard({
  pokemon,
  onClick,
  selected,
}: {
  pokemon: PokemonCardData;
  onClick?: () => void;
  selected?: boolean;
}) {
  const boldStats = highestStatKeys(pokemon);

  return (
    <div
      {...activateProps(onClick)}
      className={`relative flex h-full w-full flex-col items-center gap-2 rounded-lg border p-3 text-left transition ${
        selected
          ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30"
          : "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
      } ${
        onClick
          ? selected
            ? "cursor-pointer"
            : "cursor-pointer hover:border-violet-300 hover:shadow-md hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-400/10"
          : ""
      }`}
    >
      {selected ? (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
          ✓
        </span>
      ) : null}
      <span className="self-start text-xs text-zinc-400">#{pokemon.id}</span>
      {pokemon.spriteUrl ? (
        // Sprites come from an external host and are tiny/low-volume, so a
        // plain img is simpler here than configuring next/image remote
        // patterns for a domain we don't otherwise need.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pokemon.spriteUrl}
          alt={pokemon.name}
          width={72}
          height={72}
          loading="lazy"
          className="scale-110"
        />
      ) : (
        <div className="h-[72px] w-[72px]" />
      )}
      <span className="text-center text-sm font-medium capitalize">{pokemon.name}</span>
      <div className="flex flex-wrap justify-center gap-1">
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
      <dl className="grid w-full grid-cols-3 gap-x-2 gap-y-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
        {STATS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <dt className="uppercase">{label}</dt>
            <dd
              className={`rounded px-1 py-0.5 ${
                boldStats.has(key) ? HIGHEST_STAT_CLASSES : "font-medium text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {pokemon[key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
