import {
  listCampaigns,
  listCampaignRoster,
  listCampaignSessions,
} from "../campaigns/service.ts";
import { withBasePath } from "../../lib/base-path.ts";
import type { TavernViewer } from "./types.ts";
import {
  buildAccessRedirectPath,
  resolveCampaignViewer,
} from "./viewer.ts";

export interface HomeRosterCard {
  characterId: string;
  characterSlug: string;
  characterName: string;
  ownerLabel: string | null;
  launchHref: string;
  requiresAccess: boolean;
}

export interface HomeCampaignSection {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  progressionMode: string;
  characterCount: number;
  sessionCount: number;
  viewer: TavernViewer | null;
  dmHref: string;
  dmRequiresAccess: boolean;
  roster: HomeRosterCard[];
}

export interface HomeData {
  campaigns: HomeCampaignSection[];
}

export async function getHomeData(request: Request): Promise<HomeData> {
  const campaigns = await listCampaigns();

  const sections: HomeCampaignSection[] = await Promise.all(
    campaigns.map(async (campaign) => {
      const [roster, sessions, viewer] = await Promise.all([
        listCampaignRoster(campaign.id),
        listCampaignSessions(campaign.id),
        resolveCampaignViewer(request, campaign.id),
      ]);
      return {
        campaignId: campaign.id,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        progressionMode: campaign.progressionMode,
        characterCount: roster.length,
        sessionCount: sessions.length,
        viewer,
        dmHref:
          viewer?.canManageCampaign
            ? withBasePath(`/campaigns/${campaign.slug}/dm`)
            : buildAccessRedirectPath({
                campaignSlug: campaign.slug,
                next: `/campaigns/${campaign.slug}/dm`,
                role: "dm",
              }),
        dmRequiresAccess: !viewer?.canManageCampaign,
        roster: roster.map((entry) => ({
          characterId: entry.id,
          characterSlug: entry.slug,
          characterName: entry.name,
          ownerLabel: entry.ownerLabel,
          launchHref:
            viewer?.canManageCampaign || viewer?.characterId === entry.id
              ? withBasePath(`/characters/${entry.id}`)
              : buildAccessRedirectPath({
                  campaignSlug: campaign.slug,
                  next: `/characters/${entry.id}`,
                  role: "player",
                  characterId: entry.id,
                }),
          requiresAccess: !(
            viewer?.canManageCampaign || viewer?.characterId === entry.id
          ),
        })),
      };
    }),
  );

  return { campaigns: sections };
}
