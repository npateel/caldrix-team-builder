import { desc, eq } from "drizzle-orm";
import { ActionButton } from "@/components/action-button";
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
      <table className="w-full max-w-4xl text-left text-sm">
        <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <tr>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Owner</th>
            <th className="py-2 pr-4 font-medium">Roster</th>
            <th className="py-2 pr-4 font-medium">Updated</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {allTeams.map(({ team, ownerEmail, ownerName }) => (
            <tr key={team.id} className="border-b border-black/5 dark:border-white/5">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
