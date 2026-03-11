import { describe, expect, it, vi } from "vitest";

vi.mock("./-server.ts", () => ({
  fetchCompendiumData: vi.fn(),
}));

import { validateCompendiumSearch } from "./compendium.tsx";

describe("compendium search validation", () => {
  it("keeps populated string params and strips empty or invalid values", () => {
    expect(
      validateCompendiumSearch({
        q: "hex",
        type: "spell",
        pack: "",
        entry: 42,
        entryPack: "advanced-adventurers",
      }),
    ).toEqual({
      q: "hex",
      type: "spell",
      pack: undefined,
      entry: undefined,
      entryPack: "advanced-adventurers",
    });
  });
});
