"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateTeamButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
      >
        Create Team
      </button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setPending(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: trimmed }),
    });
    setPending(false);

    if (res.ok) {
      setName("");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team name"
        className="rounded border border-black/10 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-black"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 dark:text-zinc-400">
        Cancel
      </button>
    </form>
  );
}
