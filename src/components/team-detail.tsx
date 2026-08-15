"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PokemonCard, type PokemonCardData } from "./pokemon-card";
import type { RosterEntry } from "@/lib/team-roster";

const MAX_TEAM_SIZE = 6;

type Team = { id: string; name: string };

export function TeamDetail({
  team,
  roster,
  allPokemon,
}: {
  team: Team;
  roster: RosterEntry[];
  allPokemon: PokemonCardData[];
}) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);
  const [addQuery, setAddQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [counterTeam, setCounterTeam] = useState<PokemonCardData[] | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addResults = useMemo(() => {
    const query = addQuery.trim().toLowerCase();
    if (!query) return [];
    return allPokemon.filter((p) => p.name.includes(query)).slice(0, 8);
  }, [addQuery, allPokemon]);

  async function updateRoster(pokemonIds: number[]) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/teams/${team.id}/pokemon`, {
      method: "PUT",
      body: JSON.stringify({ pokemonIds }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to update roster");
      return;
    }
    router.refresh();
  }

  function movePokemon(index: number, direction: -1 | 1) {
    const ids = roster.map((r) => r.pokemon.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    updateRoster(ids);
  }

  function removePokemon(index: number) {
    const ids = roster.map((r) => r.pokemon.id).filter((_, i) => i !== index);
    updateRoster(ids);
  }

  function addPokemon(pokemonId: number) {
    if (roster.length >= MAX_TEAM_SIZE) return;
    updateRoster([...roster.map((r) => r.pokemon.id), pokemonId]);
    setAddQuery("");
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPending(true);
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
    setPending(false);
    if (res.ok) {
      setIsRenaming(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${team.name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  }

  async function handleGenerateCounter() {
    setCounterLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${team.id}/counter`);
    const body = await res.json().catch(() => null);
    setCounterLoading(false);
    if (!res.ok) {
      setError(body?.error ?? "Failed to generate counter team");
      return;
    }
    setCounterTeam(body.counterTeam);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        {isRenaming ? (
          <form onSubmit={handleRename} className="flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="rounded border border-black/10 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-black"
            />
            <button type="submit" disabled={pending} className="text-sm font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRenaming(false);
                setNameInput(team.name);
              }}
              className="text-sm text-zinc-500 dark:text-zinc-400"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setIsRenaming(true)} className="text-xl font-semibold">
            {team.name} <span className="text-sm font-normal text-zinc-400">(rename)</span>
          </button>
        )}
        <button type="button" onClick={handleDelete} className="text-sm text-red-600 dark:text-red-400">
          Delete team
        </button>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Roster ({roster.length}/{MAX_TEAM_SIZE})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {roster.map((entry, index) => (
            <div key={`${entry.pokemon.id}-${index}`} className="flex flex-col gap-1">
              <PokemonCard pokemon={entry.pokemon} />
              <div className="flex justify-center gap-2 text-xs">
                <button type="button" disabled={index === 0 || pending} onClick={() => movePokemon(index, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === roster.length - 1 || pending}
                  onClick={() => movePokemon(index, 1)}
                >
                  ↓
                </button>
                <button type="button" disabled={pending} onClick={() => removePokemon(index)} className="text-red-600 dark:text-red-400">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {roster.length < MAX_TEAM_SIZE ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Add a pokémon</h2>
          <input
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full max-w-xs rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
          />
          {addResults.length > 0 ? (
            <ul className="flex flex-col divide-y divide-black/5 rounded border border-black/10 dark:divide-white/5 dark:border-white/10">
              {addResults.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => addPokemon(p.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm capitalize hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {p.name}
                    <span className="text-xs text-zinc-400">#{p.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Counter team</h2>
          <button
            type="button"
            onClick={handleGenerateCounter}
            disabled={counterLoading || roster.length === 0}
            className="rounded bg-black px-3 py-1 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {counterLoading ? "Generating…" : "Generate"}
          </button>
        </div>
        {counterTeam ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {counterTeam.map((p) => (
              <PokemonCard key={p.id} pokemon={p} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
