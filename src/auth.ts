import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { cookies } from "next/headers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { accounts, sessions, teams, users, verificationTokens } from "@/db/schema";
import { ANON_USER_COOKIE } from "@/lib/user-cookie";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Table names default to singular ("user", "account", ...) unless told
  // otherwise -- ours are plural, matching the rest of this schema.
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [GitHub, Google],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // On first login, re-point whatever teams the anonymous cookie-scoped
    // user had built onto the new OAuth account, then drop the
    // now-team-less anon user row -- see adr-005.
    async signIn({ user }) {
      const userId = user.id;
      if (!userId) return;

      const cookieStore = await cookies();
      const anonId = cookieStore.get(ANON_USER_COOKIE)?.value;
      if (!anonId || anonId === userId) return;

      await db.transaction(async (tx) => {
        await tx.update(teams).set({ userId }).where(eq(teams.userId, anonId));
        await tx.delete(users).where(eq(users.id, anonId));
      });
      cookieStore.delete(ANON_USER_COOKIE);
    },
  },
});
