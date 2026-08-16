import { and, asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { TeamDetail } from "@/components/team-detail";
import { db } from "@/db";
import { pokemon, teams } from "@/db/schema";
import { getRoster } from "@/server/team-roster";

type Params = { params: Promise<{ teamId: string }> };

export default async function TeamDetailPage({ params }: Params) {
  const { teamId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

  const [team] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, session.user.id)))
    .limit(1);
  if (!team) notFound();

  const [roster, allPokemon] = await Promise.all([
    getRoster(teamId),
    db.select().from(pokemon).orderBy(asc(pokemon.id)),
  ]);

  return <TeamDetail team={team} roster={roster} allPokemon={allPokemon} />;
}
