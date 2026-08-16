import { count, desc } from "drizzle-orm";
import { ActionButton } from "@/components/action-button";
import { db } from "@/db";
import { teams, users } from "@/db/schema";

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const teamCounts = await db.select({ userId: teams.userId, teamCount: count() }).from(teams).groupBy(teams.userId);
  const teamCountByUser = new Map(teamCounts.map((row) => [row.userId, row.teamCount]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Users ({allUsers.length})</h1>
      <table className="w-full max-w-4xl text-left text-sm">
        <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <tr>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Admin</th>
            <th className="py-2 pr-4 font-medium">Teams</th>
            <th className="py-2 pr-4 font-medium">Created</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {allUsers.map((user) => (
            <tr key={user.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-4">{user.email ?? <span className="text-zinc-400">anonymous</span>}</td>
              <td className="py-2 pr-4">{user.name ?? "—"}</td>
              <td className="py-2 pr-4">{user.isAdmin ? "Yes" : ""}</td>
              <td className="py-2 pr-4">{teamCountByUser.get(user.id) ?? 0}</td>
              <td className="py-2 pr-4">{user.createdAt.toLocaleDateString()}</td>
              <td className="py-2">
                <ActionButton
                  url={`/api/admin/users/${user.id}`}
                  method="DELETE"
                  label="Delete"
                  pendingLabel="Deleting…"
                  confirmMessage={`Delete user ${user.email ?? user.id}? This deletes their teams too.`}
                  variant="link"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
