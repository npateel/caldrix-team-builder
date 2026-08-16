import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/server/admin";
import { simulateStatDrift } from "@/server/simulate-change";

// Demo-only route (see simulate-change.ts) -- desyncs one of the admin's
// own team pokemon's cached stat so the next real scan has something
// genuine to detect. Not cron-triggered, admin-session only.
export async function POST() {
  const adminId = await requireAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const drift = await simulateStatDrift(adminId);
  if (!drift) {
    return NextResponse.json({ error: "You have no team pokemon to simulate a change for" }, { status: 400 });
  }

  return NextResponse.json(drift);
}
