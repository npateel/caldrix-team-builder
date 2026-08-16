import { desc, eq } from "drizzle-orm";
import { ActionButton } from "@/components/action-button";
import { AdminTable, AdminTableHead, AdminTh, AdminTr } from "@/components/admin/table";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getRosters } from "@/server/team-roster";

export default async function AdminTeamsPage() {
  const allTeams = await db
    .select({ team: teams, ownerEmail: users.email, ownerName: users.name })
    .from(teams)
    .innerJoin(users, eq(teams.userId, users.id))
    .orderBy(desc(teams.updatedAt));

  const rosters = await getRosters(allTeams.map((row) => row.team.id));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Teams ({allTeams.length})</h1>
      <AdminTable className="max-w-4xl">
        <AdminTableHead>
          <tr>
            <AdminTh>Name</AdminTh>
            <AdminTh>Owner</AdminTh>
            <AdminTh>Roster</AdminTh>
            <AdminTh>Updated</AdminTh>
            <th className="py-2" />
          </tr>
        </AdminTableHead>
        <tbody>
          {allTeams.map(({ team, ownerEmail, ownerName }) => (
            <AdminTr key={team.id}>
              <td className="py-2 pr-4">{team.name}</td>
              <td className="py-2 pr-4">{ownerEmail ?? ownerName ?? "anonymous"}</td>
              <td className="py-2 pr-4">{(rosters.get(team.id) ?? []).length} / 6</td>
              <td className="py-2 pr-4">{team.updatedAt.toLocaleDateString()}</td>
              <td className="py-2">
                <ActionButton
                  url={`/api/admin/teams/${team.id}`}
                  method="DELETE"
                  label="Delete"
                  pendingLabel="Deleting…"
                  confirmMessage={`Delete team "${team.name}"?`}
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
