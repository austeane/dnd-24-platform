import {
  listCampaigns,
  listCampaignRoster,
  listCampaignSessions,
} from "../campaigns/service.ts";

export interface HomeRosterCard {
  characterId: string;
  characterSlug: string;
  characterName: string;
  ownerLabel: string | null;
}

export interface HomeCampaignSection {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  progressionMode: string;
  characterCount: number;
  sessionCount: number;
  roster: HomeRosterCard[];
}

export interface HomeData {
  campaigns: HomeCampaignSection[];
}

export async function getHomeData(): Promise<HomeData> {
  const campaigns = await listCampaigns();

  const sections: HomeCampaignSection[] = await Promise.all(
    campaigns.map(async (campaign) => {
      const [roster, sessions] = await Promise.all([
        listCampaignRoster(campaign.id),
        listCampaignSessions(campaign.id),
      ]);
      return {
        campaignId: campaign.id,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        progressionMode: campaign.progressionMode,
        characterCount: roster.length,
        sessionCount: sessions.length,
        roster: roster.map((entry) => ({
          characterId: entry.id,
          characterSlug: entry.slug,
          characterName: entry.name,
          ownerLabel: entry.ownerLabel,
        })),
      };
    }),
  );

  return { campaigns: sections };
}
