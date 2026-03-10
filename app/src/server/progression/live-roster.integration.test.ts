import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { getCharacterRuntimeState } from "./character-state.ts";

describe("live roster acceptance", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("computes every seeded roster character through the DB-backed runtime path", async () => {
    const campaign = await getCampaignBySlug("real-aa-campaign");
    expect(campaign).not.toBeNull();

    const roster = await listCampaignRoster(campaign!.id);
    expect(roster).toHaveLength(5);

    const runtimeStates = await Promise.all(
      roster.map(async (character) => ({
        slug: character.slug,
        state: await getCharacterRuntimeState(character.id),
      })),
    );

    for (const { slug, state } of runtimeStates) {
      expect(state, `${slug} should compute through app runtime`).not.toBeNull();
      expect(state?.name).toBeTruthy();
      expect(state?.level).toBeGreaterThanOrEqual(1);
      expect(state?.armorClass.total).toBeGreaterThan(0);
      expect(state?.maxHP).toBeGreaterThan(0);
    }

    expect(runtimeStates.find((entry) => entry.slug === "ronan-wildspark")?.state).toMatchObject({
      name: "Ronan Wildspark",
      level: 2,
    });
    expect(runtimeStates.find((entry) => entry.slug === "tali")?.state).toMatchObject({
      name: "Tali",
      level: 2,
    });
    expect(runtimeStates.find((entry) => entry.slug === "oriana")?.state).toMatchObject({
      name: "Oriana",
      level: 2,
    });
    expect(runtimeStates.find((entry) => entry.slug === "vivennah")?.state).toMatchObject({
      name: "Vivennah",
      level: 2,
    });
    expect(runtimeStates.find((entry) => entry.slug === "nara")?.state).toMatchObject({
      name: "Nara",
      level: 2,
    });
  });
});
