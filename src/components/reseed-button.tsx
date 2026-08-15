"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReseedButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm("Refetch the entire pokemon/moves cache from PokéAPI? This can take a minute or two.")) {
      return;
    }

    setPending(true);
    setSummary(null);
    const res = await fetch("/api/cron/reseed", { method: "POST" });
    const body = await res.json();
    setPending(false);

    if (res.ok) {
      setSummary(`${body.pokemon} pokemon, ${body.moves} moves, ${body.pokemonMoveLinks} links`);
      router.refresh();
    } else {
      setSummary(body.error ?? "Reseed failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {summary && <span className="text-xs text-zinc-500 dark:text-zinc-400">{summary}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Reseeding… (this takes a while)" : "Reseed cache now"}
      </button>
    </div>
  );
}
