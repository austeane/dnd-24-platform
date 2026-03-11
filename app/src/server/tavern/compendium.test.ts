import { describe, expect, it, vi } from "vitest";
vi.mock("./context.ts", () => ({
  getTavernCharacterContext: vi.fn(),
  isCanonicalPackId: (packId: string | undefined) =>
    packId === "srd-5e-2024" ||
    packId === "advanced-adventurers" ||
    packId === "campaign-private",
  toCanonicalPackIds: (enabledPackIds: string[]) =>
    enabledPackIds.filter((packId) =>
      [
        "srd-5e-2024",
        "advanced-adventurers",
        "campaign-private",
      ].includes(packId)
    ),
}));
import { buildCompendiumData } from "./compendium.ts";

describe("tavern compendium", () => {
  it("limits available packs and detail resolution to the campaign-enabled packs", () => {
    const data = buildCompendiumData(["srd-5e-2024"], {
      q: "Hex",
      entry: "aa-spell-hex",
      entryPack: "advanced-adventurers",
    });

    expect(data.availablePacks).toEqual(["srd-5e-2024"]);
    expect(data.detail).toBeNull();
    expect(data.entries.every((entry) => entry.packId === "srd-5e-2024")).toBe(
      true,
    );
  });

  it("returns detail when the requested entry belongs to an enabled pack", () => {
    const data = buildCompendiumData(
      ["srd-5e-2024", "advanced-adventurers"],
      {
        entry: "aa-spell-hex",
        entryPack: "advanced-adventurers",
      },
    );

    expect(data.detail).toEqual(
      expect.objectContaining({
        packId: "advanced-adventurers",
        entityId: "aa-spell-hex",
        name: "Hex",
      }),
    );
  });
});
