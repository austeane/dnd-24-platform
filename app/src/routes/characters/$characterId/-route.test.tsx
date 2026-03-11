import { isNotFound } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("./-server.ts", () => ({
  fetchCharacterShellData: vi.fn(),
}));

import { requireCharacterShellData } from "./route.tsx";

describe("requireCharacterShellData", () => {
  it("throws a TanStack notFound error for missing characters", () => {
    try {
      requireCharacterShellData(null);
      throw new Error("Expected notFound to be thrown");
    } catch (error) {
      expect(isNotFound(error)).toBe(true);
      expect(error).toMatchObject({
        routeId: "/characters/$characterId",
      });
    }
  });
});
