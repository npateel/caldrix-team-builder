# Use Drizzle for ORM

## Problem statement

We need a way to define schema and manage migrations against Neon (see adr-002).

## Proposed solution

Drizzle ORM + drizzle-kit -- TypeScript-first, SQL-like schema, lightweight, and
pairs well with the Neon serverless driver we already depend on.

## Alternatives

1. Prisma -- more batteries-included, but heavier and needs its own query engine;
   more setup for a serverless environment.
2. Raw SQL migrations -- full control, no abstraction, but more boilerplate for
   queries and no type safety.
