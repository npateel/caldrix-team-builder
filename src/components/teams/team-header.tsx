"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

// Team name (inline rename) + delete, self-contained since neither mutation
// touches roster state -- only `router.refresh()`/`router.push()`.
export function TeamHeader({ teamId, teamName }: { teamId: string; teamName: string }) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(teamName);
  const [pending, setPending] = useState(false);

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPending(true);
    const res = await fetch(`/api/teams/${teamId}`, {
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
    if (!confirm(`Delete "${teamName}"? This can't be undone.`)) return;
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  }

  return (
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
              setNameInput(teamName);
            }}
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setIsRenaming(true)} className="text-xl font-semibold">
          {teamName} <span className="text-sm font-normal text-zinc-400">(rename)</span>
        </button>
      )}
      <button type="button" onClick={handleDelete} className="text-sm text-red-600 dark:text-red-400">
        Delete team
      </button>
    </div>
  );
}
