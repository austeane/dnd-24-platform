import type { HomePageViewProps } from "../../../components/tavern/home/HomePageView.tsx";
import type {
  TavernCompendiumData,
  TavernInventoryData,
  TavernJournalData,
  TavernShellData,
} from "../../../server/tavern/types.ts";

type Primitive = bigint | boolean | null | number | string | symbol | undefined;

export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : { [K in keyof T]?: DeepPartial<T[K]> };

export interface TavernCompendiumViewFixture {
  query: string;
  activeType: string;
  activePack: string;
  data: TavernCompendiumData;
}

export interface TavernFixtureBundle {
  home: HomePageViewProps;
  shell: TavernShellData;
  inventory: TavernInventoryData;
  journal: TavernJournalData;
  compendium: TavernCompendiumViewFixture;
}

const taliId = "fixture-character-tali";
const vivennahId = "fixture-character-vivennah";
const naraId = "fixture-character-nara";
const orianaId = "fixture-character-oriana";
const ronanId = "fixture-character-ronan";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function mergeRecord(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = cloneValue(base);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      continue;
    }

    const current = result[key];
    if (Array.isArray(value)) {
      result[key] = cloneValue(value);
      continue;
    }

    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = mergeRecord(current, value);
      continue;
    }

    result[key] = cloneValue(value);
  }

  return result;
}

function mergeFixture<T>(base: T, overrides?: DeepPartial<T>): T {
  if (overrides === undefined) {
    return cloneValue(base);
  }

  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return cloneValue(overrides as T);
  }

  return mergeRecord(
    base as Record<string, unknown>,
    overrides as Record<string, unknown>,
  ) as T;
}

const baseHomeFixture: HomePageViewProps = {
  campaigns: [
    {
      campaignId: "fixture-campaign-real-aa",
      campaignSlug: "real-aa-campaign",
      campaignName: "Real AA Campaign",
      progressionMode: "hybrid",
      characterCount: 5,
      sessionCount: 1,
      viewer: {
        role: "player",
        characterId: taliId,
        sessionLabel: "player-fixture",
      },
      dmHref: "/campaigns/real-aa-campaign/access?next=%2Fcampaigns%2Freal-aa-campaign%2Fdm&role=dm",
      dmRequiresAccess: true,
      roster: [
        {
          characterId: taliId,
          characterName: "Tali",
          ownerLabel: "Austin",
          launchHref: `/characters/${taliId}`,
          requiresAccess: false,
        },
        {
          characterId: vivennahId,
          characterName: "Vivennah",
          ownerLabel: "Austin",
          launchHref: `/campaigns/real-aa-campaign/access?next=%2Fcharacters%2F${encodeURIComponent(vivennahId)}&role=player&characterId=${encodeURIComponent(vivennahId)}`,
          requiresAccess: true,
        },
        {
          characterId: naraId,
          characterName: "Nara",
          ownerLabel: "Austin",
          launchHref: `/campaigns/real-aa-campaign/access?next=%2Fcharacters%2F${encodeURIComponent(naraId)}&role=player&characterId=${encodeURIComponent(naraId)}`,
          requiresAccess: true,
        },
        {
          characterId: orianaId,
          characterName: "Oriana",
          ownerLabel: "Austin",
          launchHref: `/campaigns/real-aa-campaign/access?next=%2Fcharacters%2F${encodeURIComponent(orianaId)}&role=player&characterId=${encodeURIComponent(orianaId)}`,
          requiresAccess: true,
        },
        {
          characterId: ronanId,
          characterName: "Ronan Wildspark",
          ownerLabel: "Austin",
          launchHref: `/campaigns/real-aa-campaign/access?next=%2Fcharacters%2F${encodeURIComponent(ronanId)}&role=player&characterId=${encodeURIComponent(ronanId)}`,
          requiresAccess: true,
        },
      ],
    },
  ],
};

const baseShellFixture: TavernShellData = {
  campaign: {
    id: "fixture-campaign-real-aa",
    slug: "real-aa-campaign",
    name: "Real AA Campaign",
    progressionMode: "hybrid",
    enabledPackIds: ["srd-5e-2024", "advanced-adventurers"],
  },
  character: {
    id: taliId,
    slug: "tali",
    name: "Tali",
    ownerLabel: "Austin",
  },
  viewer: {
    role: "player",
    characterId: taliId,
    sessionLabel: "player-fixture",
    canEditCharacter: true,
    canManageCampaign: false,
  },
  summary: {
    subtitle: "Druid 3 · Sage",
    className: "Druid",
    species: "Elf",
    level: 3,
    abilityScores: [
      { name: "strength", score: 10, modifier: 0, isPrimary: false },
      { name: "dexterity", score: 14, modifier: 2, isPrimary: false },
      { name: "constitution", score: 14, modifier: 2, isPrimary: false },
      { name: "intelligence", score: 11, modifier: 0, isPrimary: false },
      { name: "wisdom", score: 16, modifier: 3, isPrimary: true },
      { name: "charisma", score: 8, modifier: -1, isPrimary: false },
    ],
    combat: {
      maxHp: 19,
      currentHp: 15,
      tempHp: 2,
      armorClass: 14,
      acBreakdown: "Leather Armor +2",
      initiative: 2,
      speed: 35,
      spellSaveDc: 13,
      proficiencyBonus: 2,
      conditions: [],
    },
    skills: [
      { name: "Nature", bonus: 5, proficient: true, expertise: false },
      { name: "Perception", bonus: 5, proficient: true, expertise: false },
      { name: "Survival", bonus: 5, proficient: true, expertise: false },
    ],
    features: [
      { name: "Wild Shape", origin: "Druid" },
      { name: "Druidic", origin: "Druid" },
      { name: "Alert", origin: "Feat" },
    ],
    xp: {
      totalEarned: 10,
      totalSpent: 10,
      banked: 0,
    },
  },
  spellbook: {
    castingAbility: "Wisdom",
    spellSaveDC: 13,
    spellAttackBonus: 5,
    groups: [
      {
        level: 0,
        label: "Cantrips",
        slots: [],
        spells: [
          {
            name: "Guidance",
            school: "Divination",
            castingTime: "Action",
            concentration: true,
            ritual: false,
            alwaysPrepared: true,
            freeCast: null,
          },
        ],
      },
      {
        level: 1,
        label: "Level 1",
        slots: [
          {
            resourceName: "Spell Slot (Level 1)",
            kind: "standard",
            level: 1,
            total: 4,
            current: 3,
          },
        ],
        spells: [
          {
            name: "Entangle",
            school: "Conjuration",
            castingTime: "Action",
            concentration: true,
            ritual: false,
            alwaysPrepared: true,
            freeCast: null,
          },
          {
            name: "Hex",
            school: "Enchantment",
            castingTime: "Bonus Action",
            concentration: true,
            ritual: false,
            alwaysPrepared: false,
            freeCast: null,
          },
        ],
      },
    ],
  },
  inventoryRuntime: {
    attackProfiles: [
      {
        weaponName: "Quarterstaff",
        attackBonus: "+4",
        damage: "1d8+2",
        damageType: "Bludgeoning",
        properties: ["Versatile"],
        masteryProperty: null,
      },
    ],
    resources: [
      {
        resourceName: "Wild Shape",
        name: "Wild Shape",
        current: 2,
        max: 2,
        rechargeOn: "Short Rest",
        source: "Druid",
      },
    ],
  },
};

const baseInventoryFixture: TavernInventoryData = {
  equippedItems: [
    {
      id: "item-leather-armor",
      name: "Leather Armor",
      quantity: 1,
      equipped: true,
      slot: "Armor",
    },
  ],
  carriedItems: [
    {
      id: "item-healer-kit",
      name: "Healer's Kit",
      quantity: 1,
      equipped: false,
      slot: null,
    },
  ],
  attackProfiles: cloneValue(baseShellFixture.inventoryRuntime.attackProfiles),
  resources: cloneValue(baseShellFixture.inventoryRuntime.resources),
};

const baseJournalFixture: TavernJournalData = {
  cards: [
    {
      id: "journal-card-hex-note",
      title: "Spell notes for tonight",
      bodyMd: "Hex and Entangle came up in play.",
      summary: "Hex and Entangle came up in play.",
      category: "message",
      isPinned: true,
      publishedAt: "2026-03-10T18:30:00.000Z",
    },
  ],
};

const baseCompendiumFixture: TavernCompendiumViewFixture = {
  query: "",
  activeType: "",
  activePack: "",
  data: {
    entries: [
      {
        entityId: "aa-spell-hex",
        packId: "advanced-adventurers",
        type: "spell",
        name: "Hex",
        summary: "Curse a creature and siphon its vitality.",
        tags: ["1st-level", "warlock"],
      },
      {
        entityId: "srd-spell-entangle",
        packId: "srd-5e-2024",
        type: "spell",
        name: "Entangle",
        summary: "Grasping weeds and vines sprout from the ground.",
        tags: ["1st-level", "druid"],
      },
      {
        entityId: "aa-rule-concentration",
        packId: "advanced-adventurers",
        type: "rule",
        name: "Concentration",
        summary: "You can maintain only one concentration spell at a time.",
        tags: ["rules"],
      },
    ],
    totalCount: 3,
    availableTypes: ["spell", "rule"],
    availablePacks: ["srd-5e-2024", "advanced-adventurers"],
    detail: null,
  },
};

const baseFixtureBundle: TavernFixtureBundle = {
  home: baseHomeFixture,
  shell: baseShellFixture,
  inventory: baseInventoryFixture,
  journal: baseJournalFixture,
  compendium: baseCompendiumFixture,
};

export function createTavernHomeFixture(
  overrides?: DeepPartial<HomePageViewProps>,
): HomePageViewProps {
  return mergeFixture(baseHomeFixture, overrides) as HomePageViewProps;
}

export function createTavernShellFixture(
  overrides?: DeepPartial<TavernShellData>,
): TavernShellData {
  return mergeFixture(baseShellFixture, overrides) as TavernShellData;
}

export function createTavernInventoryFixture(
  overrides?: DeepPartial<TavernInventoryData>,
): TavernInventoryData {
  return mergeFixture(baseInventoryFixture, overrides) as TavernInventoryData;
}

export function createTavernJournalFixture(
  overrides?: DeepPartial<TavernJournalData>,
): TavernJournalData {
  return mergeFixture(baseJournalFixture, overrides) as TavernJournalData;
}

export function createTavernCompendiumFixture(
  overrides?: DeepPartial<TavernCompendiumViewFixture>,
): TavernCompendiumViewFixture {
  return mergeFixture(
    baseCompendiumFixture,
    overrides,
  ) as TavernCompendiumViewFixture;
}

export function createTavernFixtureBundle(
  overrides?: DeepPartial<TavernFixtureBundle>,
): TavernFixtureBundle {
  return mergeFixture(baseFixtureBundle, overrides) as TavernFixtureBundle;
}

export const tavernFixtureScenarios = {
  default: createTavernFixtureBundle(),
  multiCampaignHome: createTavernFixtureBundle({
    home: {
      campaigns: [
        ...cloneValue(baseHomeFixture.campaigns),
        {
          campaignId: "fixture-campaign-storm-archives",
          campaignSlug: "storm-archives",
          campaignName: "Storm Archives",
          progressionMode: "standard",
          characterCount: 2,
          sessionCount: 4,
          viewer: null,
          dmHref: "/campaigns/storm-archives/access?next=%2Fcampaigns%2Fstorm-archives%2Fdm&role=dm",
          dmRequiresAccess: true,
          roster: [
            {
              characterId: "fixture-character-mira",
              characterName: "Mira",
              ownerLabel: "Guest 1",
              launchHref: "/campaigns/storm-archives/access?next=%2Fcharacters%2Ffixture-character-mira&role=player&characterId=fixture-character-mira",
              requiresAccess: true,
            },
            {
              characterId: "fixture-character-bryn",
              characterName: "Bryn",
              ownerLabel: "Guest 2",
              launchHref: "/campaigns/storm-archives/access?next=%2Fcharacters%2Ffixture-character-bryn&role=player&characterId=fixture-character-bryn",
              requiresAccess: true,
            },
          ],
        },
      ],
    },
  }),
  emptyJournal: createTavernFixtureBundle({
    shell: {
      character: {
        id: vivennahId,
        slug: "vivennah",
        name: "Vivennah",
        ownerLabel: "Austin",
      },
      summary: {
        subtitle: "Bard 2 · Entertainer",
        className: "Bard",
        species: "Human",
        level: 2,
        combat: {
          maxHp: 15,
          currentHp: 15,
          tempHp: 0,
          armorClass: 14,
          acBreakdown: "Studded Leather +2",
          initiative: 2,
          speed: 30,
          spellSaveDc: 13,
          proficiencyBonus: 2,
          conditions: [],
        },
        xp: {
          totalEarned: 0,
          totalSpent: 0,
          banked: 0,
        },
      },
      spellbook: {
        castingAbility: "Charisma",
        spellSaveDC: 13,
        spellAttackBonus: 5,
        groups: [
          {
            level: 1,
            label: "Level 1",
            slots: [
              {
                resourceName: "Spell Slot (Level 1)",
                kind: "standard",
                level: 1,
                total: 3,
                current: 3,
              },
            ],
            spells: [
              {
                name: "Healing Word",
                school: "Evocation",
                castingTime: "Bonus Action",
                concentration: false,
                ritual: false,
                alwaysPrepared: true,
                freeCast: null,
              },
            ],
          },
        ],
      },
      inventoryRuntime: {
        attackProfiles: [
          {
            weaponName: "Rapier",
            attackBonus: "+4",
            damage: "1d8+2",
            damageType: "Piercing",
            properties: ["Finesse"],
            masteryProperty: null,
          },
        ],
        resources: [
          {
            resourceName: "Bardic Inspiration",
            name: "Bardic Inspiration",
            current: 3,
            max: 3,
            rechargeOn: "Short Rest",
            source: "Bard",
          },
        ],
      },
    },
    inventory: {
      equippedItems: [
        {
          id: "item-studded-leather",
          name: "Studded Leather",
          quantity: 1,
          equipped: true,
          slot: "Armor",
        },
      ],
      carriedItems: [],
      attackProfiles: [
        {
          weaponName: "Rapier",
          attackBonus: "+4",
          damage: "1d8+2",
          damageType: "Piercing",
          properties: ["Finesse"],
          masteryProperty: null,
        },
      ],
      resources: [
        {
          resourceName: "Bardic Inspiration",
          name: "Bardic Inspiration",
          current: 3,
          max: 3,
          rechargeOn: "Short Rest",
          source: "Bard",
        },
      ],
    },
    journal: {
      cards: [],
    },
  }),
  filteredCompendium: createTavernFixtureBundle({
    compendium: {
      query: "Hex",
      activeType: "spell",
      activePack: "advanced-adventurers",
      data: {
        entries: [
          {
            entityId: "aa-spell-hex",
            packId: "advanced-adventurers",
            type: "spell",
            name: "Hex",
            summary: "Curse a creature and siphon its vitality.",
            tags: ["1st-level", "warlock"],
          },
        ],
        totalCount: 1,
        availableTypes: ["spell", "rule"],
        availablePacks: ["srd-5e-2024", "advanced-adventurers"],
        detail: {
          entityId: "aa-spell-hex",
          packId: "advanced-adventurers",
          type: "spell",
          name: "Hex",
          summary: "Curse a creature and siphon its vitality.",
          tags: ["1st-level", "warlock"],
          bodyMd:
            "Until the spell ends, you deal an extra 1d6 Necrotic damage to the target whenever you hit it with an attack.",
        },
      },
    },
  }),
};
