import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/auth";
import { ActionButton } from "@/components/action-button";
import { SignInButtons } from "@/components/auth-nav";
import { CreateTeamButton } from "@/components/teams/create-team-button";
import { TeamChangeBadge } from "@/components/teams/team-change-badge";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getRecentTeamChanges } from "@/server/team-changes";
import { getRosters } from "@/server/team-roster";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-semibold">Sign in to view your teams</h1>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Build and manage Pokémon teams, saved to your account.
        </p>
        <SignInButtons />
      </div>
    );
  }

  const userTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.userId, session.user.id))
    .orderBy(desc(teams.updatedAt));
  const [rosters, changesByTeam] = await Promise.all([
    getRosters(userTeams.map((team) => team.id)),
    getRecentTeamChanges(session.user.id),
  ]);

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
                  className="flex flex-col gap-3 rounded border border-black/10 p-3 hover:bg-black/5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{team.name}</span>
                      <TeamChangeBadge alerts={changes} />
                    </p>
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
