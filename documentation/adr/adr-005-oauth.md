# GitHub + Google OAuth

## Problem statement

adr-004 deferred real auth, using an anonymous cookie-assigned `users` row so
`teams.user_id` would already be real when auth landed. Need to add GitHub +
Google login without reworking the teams/counter-team routes that already
depend on that user id.

## Proposed solution

- Auth.js v5 (`next-auth@beta`) with `GitHub` and `Google` providers, using
  `@auth/drizzle-adapter` against the existing Postgres DB. Session strategy
  is JWT, not database sessions -- avoids needing a live DB read on every
  request just to resolve the session, and matches serverless/edge
  deployment. The adapter still needs `accounts`/`sessions`/
  `verificationTokens` tables to exist even though `sessions` isn't actively
  used under the JWT strategy.
- `users` gains `name`/`email`/`emailVerified`/`image` columns (unused by
  anonymous users, populated by the adapter on OAuth sign-in).
- `src/server/user.ts`'s `getOrCreateUserId()` now checks `auth()` first and
  returns the real session's user id if signed in, falling back to the
  existing anonymous-cookie logic otherwise. This was the whole point of
  keeping `teams.user_id` as a real FK from day one (adr-004) -- none of the
  teams/counter-team routes needed to change, only this one helper.
- On first sign-in, if an anonymous cookie user exists and differs from the
  newly authenticated user, that anonymous user's teams are re-pointed onto
  the OAuth account (`teams.user_id` updated in place -- no uniqueness
  constraints on that column make this a plain `UPDATE`, not a merge) and
  the now-team-less anon user row is deleted, in one transaction. The cookie
  is then cleared. See `src/auth.ts`'s `signIn` event.

## Alternatives

1. Drop the anonymous user's teams on first login instead of migrating them
   -- simpler (no transaction, just a delete), but throws away a guest's
   pre-login work the moment they sign in, which fights against guest mode
   being a real onramp rather than a throwaway demo mode. Was the original
   decision here; superseded once guest mode (teams usable without signing
   in at all, not just mid-OAuth-flow) made losing that work worth avoiding.
2. Database session strategy instead of JWT -- lets sessions be revoked
   server-side, but requires a DB round trip per request to validate the
   session and needs the `sessions` table actively maintained; JWT is
   simpler and sufficient here.
3. Roll a custom OAuth flow instead of Auth.js -- full control, but
   reimplements token exchange, CSRF state, and PKCE for two providers that
   Auth.js already handles.
