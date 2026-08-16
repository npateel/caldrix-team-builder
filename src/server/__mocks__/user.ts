import { vi } from "vitest";

export const TEST_USER_ID = "test-user-1";

export const getOrCreateUserId = vi.fn(async () => TEST_USER_ID);
export const getUserId = vi.fn(async () => TEST_USER_ID);
