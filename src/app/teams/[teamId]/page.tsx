import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TeamDetail } from "@/components/teams/team-detail";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getAllPokemon } from "@/server/pokemon-catalog";
import { getRoster } from "@/server/team-roster";
import { getUserId } from "@/server/user";

type Params = { params: Promise<{ teamId: string }> };

export default async function TeamDetailPage({ params }: Params) {
  const { teamId } = await params;
  const userId = await getUserId();
  if (!userId) notFound();

  const [team] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .limit(1);
  if (!team) notFound();

  const [roster, allPokemon] = await Promise.all([getRoster(teamId), getAllPokemon()]);

  return <TeamDetail team={team} roster={roster} allPokemon={allPokemon} />;
}
