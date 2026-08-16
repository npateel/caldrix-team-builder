"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_ITEMS = [
  { href: "/", label: "Teams" },
  { href: "/pokedex", label: "Pokédex" },
] as const;

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-1 transition-colors ${
        active
          ? "border-violet-600 font-semibold text-violet-600 dark:border-violet-400 dark:text-violet-400"
          : "border-transparent text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
      }`}
    >
      {label}
    </Link>
  );
}

export function HeaderNav({ showAdminLink }: { showAdminLink: boolean }) {
  const pathname = usePathname();
  const items = showAdminLink ? [...BASE_ITEMS, { href: "/admin", label: "Admin" }] : BASE_ITEMS;

  return (
    <nav className="flex items-center gap-5 text-sm">
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
        />
      ))}
    </nav>
  );
}
