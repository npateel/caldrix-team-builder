import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { CreateTeamButton } from "@/components/teams/create-team-button";
import { TeamChangeBadge } from "@/components/teams/team-change-badge";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getRecentTeamChanges, type TeamChangeAlert } from "@/server/team-changes";
import { getRosters } from "@/server/team-roster";
import { getUserId } from "@/server/user";

export default async function Home() {
  // getUserId (not getOrCreateUserId) since Server Components can't set
  // the anon cookie mid-render -- a first-time guest just sees an empty
  // list until CreateTeamButton's POST bootstraps them via the route
  // handler.
  const userId = await getUserId();

  // Neither of these needs the other, so they run together -- getRosters
  // below does depend on userTeams' ids, so it has to wait for this pair.
  const [userTeams, changesByTeam] = await Promise.all([
    userId
      ? db.select().from(teams).where(eq(teams.userId, userId)).orderBy(desc(teams.updatedAt))
      : Promise.resolve([]),
    userId ? getRecentTeamChanges(userId) : Promise.resolve(new Map<string, TeamChangeAlert[]>()),
  ]);
  const rosters = await getRosters(userTeams.map((team) => team.id));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your teams</h1>
        <CreateTeamButton />
      </div>

      {userTeams.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No teams yet -- create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {userTeams.map((team) => {
            const roster = rosters.get(team.id) ?? [];
            const changes = changesByTeam.get(team.id) ?? [];
            return (
              <li key={team.id} className="relative">
                <div className="absolute right-2 top-2 z-10 rounded bg-white/90 px-1.5 py-1 shadow-sm dark:bg-zinc-900/90">
                  <ActionButton
                    url={`/api/teams/${team.id}`}
                    method="DELETE"
                    label="Delete"
                    pendingLabel="Deleting…"
                    confirmMessage={`Delete "${team.name}"? This can't be undone.`}
                    variant="link"
                  />
                </div>
                <Link
                  href={`/teams/${team.id}`}
                  className="flex flex-col gap-3 rounded border border-black/10 p-3 transition hover:border-violet-300 hover:shadow-md hover:shadow-violet-500/10 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:hover:border-violet-800 dark:hover:shadow-violet-400/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{team.name}</span>
                      <TeamChangeBadge alerts={changes} />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {roster.length} pokémon · updated {team.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  {roster.length > 0 ? (
                    <div className="mr-8 flex flex-wrap items-center gap-2">
                      {roster.map((entry) =>
                        entry.pokemon.spriteUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={entry.pokemon.id}
                            src={entry.pokemon.spriteUrl}
                            alt={entry.pokemon.name}
                            width={56}
                            height={56}
                          />
                        ) : (
                          <div key={entry.pokemon.id} className="h-14 w-14" />
                        ),
                      )}
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
