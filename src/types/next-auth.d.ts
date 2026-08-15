import type { DefaultSession } from "next-auth";

// Populated in the `session` callback in src/auth.ts.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
