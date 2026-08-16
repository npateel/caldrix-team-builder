import type { KeyboardEvent } from "react";

// Makes a non-interactive element (div/span) keyboard-and-click activatable,
// matching native <button> Enter/Space behavior. Spread onto the element;
// returns {} when onActivate is omitted, so the element stays inert instead
// of becoming a bogus, unfocusable "button".
export function activateProps(onActivate?: () => void) {
  if (!onActivate) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
