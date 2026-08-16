import type { ReactNode } from "react";

// Shared structural chrome for the admin section's read-only data tables
// (users, teams, changes, moves) -- the outer <table>, header row styling,
// and body row divider are identical everywhere; `td` styling stays
// per-caller since it varies (padding, capitalize, color) cell to cell.
export function AdminTable({ className = "", children }: { className?: string; children: ReactNode }) {
  return <table className={`w-full text-left text-sm ${className}`}>{children}</table>;
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      {children}
    </thead>
  );
}

export function AdminTh({ children }: { children?: ReactNode }) {
  return <th className="py-2 pr-4 font-medium">{children}</th>;
}

export function AdminTr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-black/5 dark:border-white/5">{children}</tr>;
}
