"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Shared shape behind every "hit an API route, then refresh the page"
// button: optional confirm, disabled while in flight, router.refresh() on
// success. Two looks -- "solid" for standalone actions (reseed, scan) and
// "link" for the small destructive links that sit inside table rows.
type Variant = "solid" | "link";

const VARIANT_CLASSES: Record<Variant, string> = {
  solid: "rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black",
  link: "text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400",
};

// Fills "{checked} checked, {changed} changed" from the JSON response. This
// is a string template rather than a format callback because every caller
// is a server component, and functions can't cross that boundary.
function fillTemplate(template: string, body: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(body[key] ?? ""));
}

export function ActionButton({
  url,
  method = "POST",
  label,
  pendingLabel,
  confirmMessage,
  summaryTemplate,
  errorMessage = "Request failed",
  variant = "solid",
}: {
  url: string;
  method?: "POST" | "DELETE";
  label: string;
  pendingLabel: string;
  confirmMessage?: string;
  // When set, the response body is read and rendered next to the button.
  // Left unset for routes that return no body worth showing.
  summaryTemplate?: string;
  errorMessage?: string;
  variant?: Variant;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setPending(true);
    setSummary(null);
    const res = await fetch(url, { method });
    setPending(false);

    if (!summaryTemplate) {
      if (res.ok) router.refresh();
      return;
    }

    const body = await res.json();
    if (res.ok) {
      setSummary(fillTemplate(summaryTemplate, body));
      router.refresh();
    } else {
      setSummary(body.error ?? errorMessage);
    }
  }

  const button = (
    <button type="button" onClick={handleClick} disabled={pending} className={VARIANT_CLASSES[variant]}>
      {pending ? pendingLabel : label}
    </button>
  );

  if (!summaryTemplate) return button;

  return (
    <div className="flex items-center gap-3">
      {summary && <span className="text-xs text-zinc-500 dark:text-zinc-400">{summary}</span>}
      {button}
    </div>
  );
}
