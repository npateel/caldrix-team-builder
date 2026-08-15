import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const NAV_ITEMS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/pokemon", label: "Pokémon" },
  { href: "/admin/moves", label: "Moves" },
  { href: "/admin/changes", label: "Changes" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="flex gap-4 border-b border-black/10 px-4 py-2 text-sm dark:border-white/10">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">{children}</div>
    </div>
  );
}
