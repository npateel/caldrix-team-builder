import { count, desc } from "drizzle-orm";
import { ActionButton } from "@/components/action-button";
import { AdminTable, AdminTableHead, AdminTh, AdminTr } from "@/components/admin/table";
import { db } from "@/db";
import { teams, users } from "@/db/schema";

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const teamCounts = await db.select({ userId: teams.userId, teamCount: count() }).from(teams).groupBy(teams.userId);
  const teamCountByUser = new Map(teamCounts.map((row) => [row.userId, row.teamCount]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Users ({allUsers.length})</h1>
      <AdminTable className="max-w-4xl">
        <AdminTableHead>
          <tr>
            <AdminTh>Email</AdminTh>
            <AdminTh>Name</AdminTh>
            <AdminTh>Admin</AdminTh>
            <AdminTh>Teams</AdminTh>
            <AdminTh>Created</AdminTh>
            <th className="py-2" />
          </tr>
        </AdminTableHead>
        <tbody>
          {allUsers.map((user) => (
            <AdminTr key={user.id}>
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
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
