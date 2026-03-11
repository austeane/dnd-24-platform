import type {
  HomeCampaignCardProps,
  HomePageViewProps,
  HomeRosterCardProps,
} from "../../components/tavern/home/HomePageView.tsx";
import type { HomeData } from "../../server/tavern/home.ts";

export type CampaignCardProps = HomeCampaignCardProps;
export type RosterCardProps = HomeRosterCardProps;

export function toHomePageProps(data: HomeData): HomePageViewProps {
  return {
    campaigns: data.campaigns.map((campaign) => ({
      campaignId: campaign.campaignId,
      campaignSlug: campaign.campaignSlug,
      campaignName: campaign.campaignName,
      progressionMode: campaign.progressionMode,
      characterCount: campaign.characterCount,
      sessionCount: campaign.sessionCount,
      viewer: campaign.viewer
        ? {
            role: campaign.viewer.role,
            characterId: campaign.viewer.characterId,
          }
        : null,
      dmHref: campaign.dmHref,
      dmRequiresAccess: campaign.dmRequiresAccess,
      roster: campaign.roster.map((entry) => ({
        characterId: entry.characterId,
        characterName: entry.characterName,
        ownerLabel: entry.ownerLabel,
        launchHref: entry.launchHref,
        requiresAccess: entry.requiresAccess,
      })),
    })),
  };
}
