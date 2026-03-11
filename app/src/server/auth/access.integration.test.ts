import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/service.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import {
  bootstrapDmPassword,
  createAccessSession,
  getCampaignAccessStatus,
  requireCharacterAccess,
  requireDmAccess,
  revokeAccessSession,
  setCharacterPassword,
  validateAccessSession,
} from "./service.ts";

async function getCampaignAndRoster() {
  const campaign = await getCampaignBySlug("real-aa-campaign");
  if (!campaign) {
    throw new Error("real-aa-campaign not found");
  }

  const roster = await listCampaignRoster(campaign.id);
  const tali = roster.find((entry) => entry.slug === "tali");
  const vivennah = roster.find((entry) => entry.slug === "vivennah");
  if (!tali || !vivennah) {
    throw new Error("Expected Tali and Vivennah in the seeded roster");
  }

  return {
    campaign,
    tali,
    vivennah,
  };
}

describe("access integration", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("allows DM bootstrap exactly once per campaign", async () => {
    const { campaign } = await getCampaignAndRoster();

    expect(await getCampaignAccessStatus(campaign.id)).toMatchObject({
      hasDmPassword: false,
      playerCharacterIds: [],
    });

    await bootstrapDmPassword({
      campaignId: campaign.id,
      password: "hearthstone-dm",
      actorLabel: "integration-test",
    });

    expect(await getCampaignAccessStatus(campaign.id)).toMatchObject({
      hasDmPassword: true,
      playerCharacterIds: [],
    });

    await expect(
      bootstrapDmPassword({
        campaignId: campaign.id,
        password: "hearthstone-dm-2",
        actorLabel: "integration-test",
      }),
    ).rejects.toThrow("DM password is already configured");
  });

  it("scopes player sessions to one character while DM sessions can access the whole campaign", async () => {
    const { campaign, tali, vivennah } = await getCampaignAndRoster();

    await bootstrapDmPassword({
      campaignId: campaign.id,
      password: "hearthstone-dm",
      actorLabel: "integration-test",
    });
    await setCharacterPassword({
      campaignId: campaign.id,
      characterId: tali.id,
      password: "tali-player-pass",
      actorLabel: "integration-test",
    });

    const dmSessionToken = await createAccessSession({
      campaignId: campaign.id,
      password: "hearthstone-dm",
      actorLabel: "integration-test",
      sessionLabel: "dm-web",
    });
    const playerSessionToken = await createAccessSession({
      campaignId: campaign.id,
      characterId: tali.id,
      password: "tali-player-pass",
      actorLabel: "integration-test",
      sessionLabel: "player-web",
    });

    const dmSession = await validateAccessSession({
      campaignId: campaign.id,
      token: dmSessionToken.token,
    });
    const playerSession = await validateAccessSession({
      campaignId: campaign.id,
      token: playerSessionToken.token,
    });

    expect(dmSession).not.toBeNull();
    expect(playerSession).not.toBeNull();
    expect(playerSession?.characterId).toBe(tali.id);

    expect(() => requireDmAccess(dmSession)).not.toThrow();
    expect(() =>
      requireCharacterAccess(dmSession, campaign.id, vivennah.id),
    ).not.toThrow();
    expect(() =>
      requireCharacterAccess(playerSession, campaign.id, tali.id),
    ).not.toThrow();
    expect(() =>
      requireCharacterAccess(playerSession, campaign.id, vivennah.id),
    ).toThrow("Character access required");
  });

  it("revoked sessions no longer validate", async () => {
    const { campaign } = await getCampaignAndRoster();

    await bootstrapDmPassword({
      campaignId: campaign.id,
      password: "hearthstone-dm",
      actorLabel: "integration-test",
    });

    const sessionToken = await createAccessSession({
      campaignId: campaign.id,
      password: "hearthstone-dm",
      actorLabel: "integration-test",
      sessionLabel: "dm-web",
    });

    const activeSession = await validateAccessSession({
      campaignId: campaign.id,
      token: sessionToken.token,
    });
    expect(activeSession).not.toBeNull();

    await revokeAccessSession(activeSession!.id);

    const revokedSession = await validateAccessSession({
      campaignId: campaign.id,
      token: sessionToken.token,
    });
    expect(revokedSession).toBeNull();
  });
});
