import { vi } from "vitest";

// A minimal stand-in for the Drizzle query builder, for route handler unit
// tests. Every top-level call (select/selectDistinct/insert/update/delete,
// including those made on the `tx` object inside a transaction) pops the
// next value off a shared queue -- tests push() expected results in the
// same order the route under test will request them. Chain methods
// (.from/.where/.limit/etc.) are no-ops that return the same object; the
// queued value only resolves once the chain is actually awaited. Pushing
// an Error makes that call reject, for exercising try/catch paths (e.g. a
// simulated FK violation).
const queue: unknown[] = [];

export function push(result: unknown) {
  queue.push(result);
}

export function reset() {
  queue.length = 0;
}

function nextResult(): unknown {
  if (queue.length === 0) {
    throw new Error("db mock: no queued result -- call push() for every expected db call, in call order");
  }
  return queue.shift();
}

function chainable(): unknown {
  const proxy: unknown = new Proxy(() => {}, {
    apply() {
      return proxy;
    },
    get(_target, prop) {
      if (prop === "then") {
        const value = nextResult();
        return (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
          (value instanceof Error ? Promise.reject(value) : Promise.resolve(value)).then(onFulfilled, onRejected);
      }
      return () => proxy;
    },
  });
  return proxy;
}

function makeQueryMethods() {
  return {
    select: vi.fn(() => chainable()),
    selectDistinct: vi.fn(() => chainable()),
    insert: vi.fn(() => chainable()),
    update: vi.fn(() => chainable()),
    delete: vi.fn(() => chainable()),
  };
}

export const db = {
  ...makeQueryMethods(),
  transaction: vi.fn(async (callback: (tx: ReturnType<typeof makeQueryMethods>) => Promise<unknown>) =>
    callback(makeQueryMethods()),
  ),
};
