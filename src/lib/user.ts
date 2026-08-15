import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const USER_COOKIE = "userId";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Anonymous, cookie-scoped user -- no OAuth yet (see adr-004). Creates a
// users row + cookie on first visit; swaps cleanly for real auth later.
export async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(USER_COOKIE)?.value;
  if (existingId) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, existingId)).limit(1);
    if (user) return user.id;
  }

  const [created] = await db.insert(users).values({}).returning({ id: users.id });
  cookieStore.set(USER_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });
  return created.id;
}
