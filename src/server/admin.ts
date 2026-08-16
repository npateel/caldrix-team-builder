import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

// 404s (not 403/redirect) so /admin's existence isn't confirmed to
// non-admins. See adr-006.
export async function requireAdmin(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) notFound();

  if (!(await isAdmin(session.user.id))) notFound();

  return { id: session.user.id };
}

// Non-throwing check, for conditionally showing an "Admin" nav link only to
// admins rather than revealing the route to everyone.
export async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.isAdmin ?? false;
}

// For API route handlers, where notFound() doesn't apply the way it does in
// pages/layouts -- callers return their own 404 JSON response when this is
// null, keeping the "don't confirm /admin exists" behavior consistent.
export async function requireAdminUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return (await isAdmin(session.user.id)) ? session.user.id : null;
}
