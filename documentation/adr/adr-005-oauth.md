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
- `src/lib/user.ts`'s `getOrCreateUserId()` now checks `auth()` first and
  returns the real session's user id if signed in, falling back to the
  existing anonymous-cookie logic otherwise. This was the whole point of
  keeping `teams.user_id` as a real FK from day one (adr-004) -- none of the
  teams/counter-team routes needed to change, only this one helper.
- On first sign-in, if an anonymous cookie user exists and differs from the
  newly authenticated user, that anonymous user row is deleted (cascades to
  their teams) and the cookie is cleared. Anonymous work isn't migrated onto
  the OAuth account -- it's just dropped.

## Alternatives

1. Migrate the anonymous user's teams onto the OAuth account on first login
   (re-point `teams.user_id`, delete the empty anon row) instead of dropping
   them -- more considerate of a user's pre-login work, but more logic for a
   case that's mostly relevant during local testing/demoing, not real usage.
   Explicitly decided against.
2. Database session strategy instead of JWT -- lets sessions be revoked
   server-side, but requires a DB round trip per request to validate the
   session and needs the `sessions` table actively maintained; JWT is
   simpler and sufficient here.
3. Roll a custom OAuth flow instead of Auth.js -- full control, but
   reimplements token exchange, CSRF state, and PKCE for two providers that
   Auth.js already handles.
