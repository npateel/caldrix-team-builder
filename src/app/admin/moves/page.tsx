import { asc } from "drizzle-orm";
import { AdminMovesTable } from "@/components/admin/moves-table";
import { db } from "@/db";
import { moves } from "@/db/schema";

export default async function AdminMovesPage() {
  const allMoves = await db.select().from(moves).orderBy(asc(moves.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h1 className="text-xl font-semibold">Moves cache ({allMoves.length})</h1>
      <AdminMovesTable moves={allMoves} />
    </div>
  );
}
