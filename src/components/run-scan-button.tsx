"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunScanButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setSummary(null);
    const res = await fetch("/api/cron/scan-changes", { method: "POST" });
    const body = await res.json();
    setPending(false);

    if (res.ok) {
      setSummary(`Checked ${body.checked}, ${body.changed} changed`);
      router.refresh();
    } else {
      setSummary(body.error ?? "Scan failed");
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
        {pending ? "Scanning…" : "Run scan now"}
      </button>
    </div>
  );
}
