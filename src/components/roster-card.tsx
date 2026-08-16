import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { ReactNode } from "react";
import { highestStatKeys, STAT_KEYS, statTotal, type PokemonCardData } from "@/lib/pokemon-stats";
import { TYPE_COLORS } from "@/lib/type-colors";

export type RosterRowLayout = "narrow" | "phone" | "desktop";

// Horizontal insertion-point indicator shown between roster rows while
// dragging -- a thin, otherwise-invisible slot that lights up to mark
// exactly where the dragged pokemon would land.
export function DropLine({ active }: { active: boolean }) {
  return <div className={`my-0.5 h-0.5 rounded-full ${active ? "bg-emerald-500" : "bg-transparent"}`} />;
}

// Order must match STAT_KEYS -- each stat gets its own label since this
// card appears in contexts with no nearby legend (roster list, counter-team
// list, quick-add dropdown).
const STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

function RosterName({ pokemon }: { pokemon: PokemonCardData }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-0 truncate text-sm font-medium capitalize">{pokemon.name}</span>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {pokemon.types.map((type) => (
          <span
            key={type}
            className="rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize text-white"
            style={{ backgroundColor: TYPE_COLORS[type] }}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

function RosterStats({ pokemon, gap }: { pokemon: PokemonCardData; gap: string }) {
  const boldStats = highestStatKeys(pokemon);
  return (
    <div className={`flex ${gap}`}>
      {STAT_KEYS.map((key, i) => (
        <div key={key} className="flex flex-col items-center">
          <span className="text-[8px] uppercase text-zinc-400">{STAT_LABELS[i]}</span>
          <span
            className={
              boldStats.has(key)
                ? "rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "text-[10px] font-medium text-zinc-700 dark:text-zinc-300"
            }
          >
            {pokemon[key]}
          </span>
        </div>
      ))}
      <div className="flex flex-col items-center">
        <span className="text-[8px] uppercase text-zinc-400">Tot</span>
        <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">{statTotal(pokemon)}</span>
      </div>
    </div>
  );
}

// Sprite + name/types + labeled stats, composed for each layout. Below
// NARROW_BREAKPOINT (see team-detail.tsx), stats move to their own
// full-width line under sprite/name/trailing -- there just isn't room for
// all of it on one line. `trailing` is the up/down/remove button group,
// only passed by the editable roster list.
export function RosterCard({
  pokemon,
  layout,
  trailing,
}: {
  pokemon: PokemonCardData;
  layout: RosterRowLayout;
  trailing?: ReactNode;
}) {
  const statGap = layout === "desktop" ? "gap-4" : "gap-2";
  const sprite = pokemon.spriteUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pokemon.spriteUrl} alt={pokemon.name} width={32} height={32} className="shrink-0" />
  ) : (
    <div className="h-8 w-8 shrink-0" />
  );

  if (layout === "narrow") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {sprite}
          <div className="min-w-0 flex-1">
            <RosterName pokemon={pokemon} />
          </div>
          {trailing}
        </div>
        <div className="pl-10">
          <RosterStats pokemon={pokemon} gap={statGap} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {sprite}
      {/* Phone: shrink to the width of the widest line (almost always the
          stats row) instead of stretching full-width -- otherwise
          justify-between spreads the type badges all the way to the row's
          far right edge, past where the stats end below them. */}
      <div className={`flex min-w-0 flex-col gap-1 ${layout === "desktop" ? "flex-1" : "w-fit"}`}>
        <RosterName pokemon={pokemon} />
        <RosterStats pokemon={pokemon} gap={statGap} />
      </div>
      {trailing}
    </div>
  );
}

// The mobile-only up/down/remove button group passed as RosterCard's
// `trailing` slot in the editable roster list (see team-detail.tsx).
export function RosterRowControls({
  onMoveUp,
  onMoveDown,
  onRemove,
  disableUp,
  disableDown,
  disabled,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  disableUp: boolean;
  disableDown: boolean;
  disabled: boolean;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label="Move up"
        disabled={disableUp || disabled}
        onClick={onMoveUp}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 disabled:opacity-30 dark:border-white/10"
      >
        <ArrowUp size={18} />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={disableDown || disabled}
        onClick={onMoveDown}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 disabled:opacity-30 dark:border-white/10"
      >
        <ArrowDown size={18} />
      </button>
      <button
        type="button"
        aria-label="Remove from team"
        disabled={disabled}
        onClick={onRemove}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-600 disabled:opacity-30 dark:border-red-900 dark:text-red-400"
      >
        <X size={18} />
      </button>
    </div>
  );
}
