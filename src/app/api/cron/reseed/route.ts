import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { reseed } from "@/lib/reseed";

// ~2200 PokéAPI calls even at CONCURRENCY=20 -- needs a paid Vercel plan's
// higher function duration ceiling (Hobby's default won't cover this). See
// adr-007.
export const maxDuration = 300;

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
  const result = await reseed();
  return NextResponse.json(result);
}

export const POST = GET;
