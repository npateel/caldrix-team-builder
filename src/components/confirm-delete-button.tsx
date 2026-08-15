"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConfirmDeleteButton({ url, confirmMessage }: { url: string; confirmMessage: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;

    setPending(true);
    const res = await fetch(url, { method: "DELETE" });
    setPending(false);

    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
