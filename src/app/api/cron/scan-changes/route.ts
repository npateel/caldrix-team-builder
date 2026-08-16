import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";
import { scanForChanges } from "@/server/scan-changes";

// Two ways in: Vercel Cron (see vercel.json), authenticated via
// CRON_SECRET, or an admin manually triggering a scan from /admin/changes.
// Same route either way -- one implementation, two triggers (see adr-006).
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  const session = await auth();
  if (!session?.user?.id) return false;
  return isAdmin(session.user.id);
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await scanForChanges();
  return NextResponse.json(result);
}

export const POST = GET;
