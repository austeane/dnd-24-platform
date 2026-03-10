import type { HomeData } from "../../server/tavern/home.ts";

export interface CampaignCardProps {
  campaignId: string;
  campaignName: string;
  progressionMode: string;
  characterCount: number;
  sessionCount: number;
  roster: RosterCardProps[];
}

export interface RosterCardProps {
  characterId: string;
  characterName: string;
  ownerLabel: string | null;
}

export function toHomePageProps(data: HomeData): {
  campaigns: CampaignCardProps[];
} {
  return {
    campaigns: data.campaigns.map((campaign) => ({
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName,
      progressionMode: campaign.progressionMode,
      characterCount: campaign.characterCount,
      sessionCount: campaign.sessionCount,
      roster: campaign.roster.map((entry) => ({
        characterId: entry.characterId,
        characterName: entry.characterName,
        ownerLabel: entry.ownerLabel,
      })),
    })),
  };
}
