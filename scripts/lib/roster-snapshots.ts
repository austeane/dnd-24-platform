import { computeCharacterState, type CharacterState } from "../../library/src/index.ts";
import {
  buildCharacterFixture,
  loadVerifiedRoster,
  rosterSlugs,
} from "../../data/fleet/fixture-patterns.ts";

export interface SerializedRosterSnapshot {
  slug: string;
  name: string;
  level: number;
  armorClass: number;
  maxHP: number;
  speed: number;
  initiative: number;
  passivePerception: number;
  resources: Array<{
    name: string;
    currentUses: number;
    maxUses: number;
    resetOn: "short" | "long";
  }>;
  spellcasting: {
    grantedSpellNames: string[];
    slotPools: Array<{
      source: string;
      resetOn: "short" | "long";
      slots: Array<{
        level: number;
        total: number;
        current: number;
      }>;
    }>;
  } | null;
  attackProfiles: Array<{
    name: string;
    ability: string;
    attackBonus: number;
    damageDice: string;
    masteryProperty?: string;
  }>;
  traits: string[];
  conditions: string[];
}

function serializeCharacterState(
  slug: string,
  state: CharacterState,
): SerializedRosterSnapshot {
  return {
    slug,
    name: state.name,
    level: state.level,
    armorClass: state.armorClass.total,
    maxHP: state.maxHP,
    speed: state.speed,
    initiative: state.initiative.total,
    passivePerception: state.passivePerception.total,
    resources: state.resources
      .map((resource) => ({
        name: resource.name,
        currentUses: resource.currentUses,
        maxUses: resource.maxUses,
        resetOn: resource.resetOn,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    spellcasting: state.spellcasting
      ? {
          grantedSpellNames: [...state.spellcasting.grantedSpellNames].sort((left, right) =>
            left.localeCompare(right)
          ),
          slotPools: state.spellcasting.slotPools
            .map((pool) => ({
              source: pool.source,
              resetOn: pool.resetOn,
              slots: pool.slots.map((slot) => ({
                level: slot.level,
                total: slot.total,
                current: slot.current,
              })),
            }))
            .sort((left, right) => left.source.localeCompare(right.source)),
        }
      : null,
    attackProfiles: state.attackProfiles
      .map((profile) => ({
        name: profile.name,
        ability: profile.ability,
        attackBonus: profile.attackBonus,
        damageDice: profile.damageDice,
        masteryProperty: profile.masteryProperty,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    traits: state.traits.map((trait) => trait.name).sort((left, right) => left.localeCompare(right)),
    conditions: state.conditions.active
      .map((condition) => condition.conditionName)
      .sort((left, right) => left.localeCompare(right)),
  };
}

export function buildFixtureRosterSnapshotDocument(): SerializedRosterSnapshot[] {
  const roster = loadVerifiedRoster();

  return rosterSlugs.map((slug) => {
    const input = buildCharacterFixture(roster, slug);
    const state = computeCharacterState(input);
    return serializeCharacterState(slug, state);
  });
}

export async function buildLiveRosterSnapshotDocument(
  campaignSlug = "real-aa-campaign",
): Promise<SerializedRosterSnapshot[]> {
  const [{ getCampaignBySlug, listCampaignRoster }, { getCharacterRuntimeState }] = await Promise.all([
    import("../../app/src/server/campaigns/index.ts"),
    import("../../app/src/server/progression/index.ts"),
  ]);
  const campaign = await getCampaignBySlug(campaignSlug);
  if (!campaign) {
    throw new Error(`Campaign ${campaignSlug} not found`);
  }

  const roster = await listCampaignRoster(campaign.id);
  const snapshots: SerializedRosterSnapshot[] = [];

  for (const character of roster.sort((left, right) => left.slug.localeCompare(right.slug))) {
    const state = await getCharacterRuntimeState(character.id);
    if (!state) {
      throw new Error(`Could not build runtime state for ${character.slug}`);
    }

    snapshots.push(serializeCharacterState(character.slug, state));
  }

  return snapshots;
}
