import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ANON_USER_COOKIE } from "@/lib/user-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Prefers a real OAuth session (see src/auth.ts) if signed in. Otherwise
// falls back to an anonymous, cookie-scoped user (adr-004) -- creates a
// users row + cookie on first visit.
export async function getOrCreateUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  const existingId = cookieStore.get(ANON_USER_COOKIE)?.value;
  if (existingId) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, existingId)).limit(1);
    if (user) return user.id;
  }

  const [created] = await db.insert(users).values({}).returning({ id: users.id });
  cookieStore.set(ANON_USER_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });
  return created.id;
}
