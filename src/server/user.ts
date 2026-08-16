import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ANON_USER_COOKIE } from "@/lib/user-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Prefers a real OAuth session (see src/auth.ts) if signed in. Otherwise
// looks for an anonymous, cookie-scoped user (adr-004). Returns null if
// neither exists yet -- doesn't create one, so this is safe to call from
// Server Components (which, unlike Server Actions/Route Handlers, can't
// set cookies mid-render).
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const cookieStore = await cookies();
  const existingId = cookieStore.get(ANON_USER_COOKIE)?.value;
  if (!existingId) return null;

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, existingId)).limit(1);
  return user?.id ?? null;
}

// Same as getUserId, but creates a users row + cookie for a first-time
// guest instead of returning null. Only callable from a Server Action or
// Route Handler -- cookieStore.set throws otherwise.
export async function getOrCreateUserId(): Promise<string> {
  const existingId = await getUserId();
  if (existingId) return existingId;

  const [created] = await db.insert(users).values({}).returning({ id: users.id });
  const cookieStore = await cookies();
  cookieStore.set(ANON_USER_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });
  return created.id;
}
