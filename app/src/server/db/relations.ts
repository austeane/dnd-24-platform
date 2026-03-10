import { defineRelations } from "drizzle-orm";
import * as schema from "./schema/index.ts";

export const relations = defineRelations(schema, (r) => ({
  campaigns: {
    accessCredentials: r.many.accessCredentials({
      from: r.campaigns.id,
      to: r.accessCredentials.campaignId,
    }),
    accessSessions: r.many.accessSessions({
      from: r.campaigns.id,
      to: r.accessSessions.campaignId,
    }),
    characters: r.many.characters({
      from: r.campaigns.id,
      to: r.characters.campaignId,
    }),
    characterSpendPlans: r.many.characterSpendPlans({
      from: r.campaigns.id,
      to: r.characterSpendPlans.campaignId,
    }),
    communicationItems: r.many.communicationItems({
      from: r.campaigns.id,
      to: r.communicationItems.campaignId,
    }),
    sessions: r.many.sessions({
      from: r.campaigns.id,
      to: r.sessions.campaignId,
    }),
    xpTransactions: r.many.xpTransactions({
      from: r.campaigns.id,
      to: r.xpTransactions.campaignId,
    }),
  },
  characters: {
    accessCredentials: r.many.accessCredentials({
      from: r.characters.id,
      to: r.accessCredentials.characterId,
    }),
    accessSessions: r.many.accessSessions({
      from: r.characters.id,
      to: r.accessSessions.characterId,
    }),
    campaign: r.one.campaigns({
      from: r.characters.campaignId,
      to: r.campaigns.id,
    }),
    characterSources: r.many.characterSources({
      from: r.characters.id,
      to: r.characterSources.characterId,
    }),
    characterSpendPlans: r.many.characterSpendPlans({
      from: r.characters.id,
      to: r.characterSpendPlans.characterId,
    }),
    communicationTargets: r.many.communicationTargets({
      from: r.characters.id,
      to: r.communicationTargets.characterId,
    }),
    xpTransactions: r.many.xpTransactions({
      from: r.characters.id,
      to: r.xpTransactions.characterId,
    }),
    skillChoices: r.many.characterSkillChoices({
      from: r.characters.id,
      to: r.characterSkillChoices.characterId,
    }),
    featChoices: r.many.characterFeatChoices({
      from: r.characters.id,
      to: r.characterFeatChoices.characterId,
    }),
    equipment: r.many.characterEquipment({
      from: r.characters.id,
      to: r.characterEquipment.characterId,
    }),
    weaponMasteries: r.many.characterWeaponMasteries({
      from: r.characters.id,
      to: r.characterWeaponMasteries.characterId,
    }),
    metamagicChoices: r.many.characterMetamagicChoices({
      from: r.characters.id,
      to: r.characterMetamagicChoices.characterId,
    }),
    pactBladeBonds: r.many.characterPactBladeBonds({
      from: r.characters.id,
      to: r.characterPactBladeBonds.characterId,
    }),
  },
  characterSources: {
    character: r.one.characters({
      from: r.characterSources.characterId,
      to: r.characters.id,
    }),
  },
  accessCredentials: {
    campaign: r.one.campaigns({
      from: r.accessCredentials.campaignId,
      to: r.campaigns.id,
    }),
    character: r.one.characters({
      from: r.accessCredentials.characterId,
      to: r.characters.id,
    }),
    sessions: r.many.accessSessions({
      from: r.accessCredentials.id,
      to: r.accessSessions.credentialId,
    }),
  },
  accessSessions: {
    campaign: r.one.campaigns({
      from: r.accessSessions.campaignId,
      to: r.campaigns.id,
    }),
    credential: r.one.accessCredentials({
      from: r.accessSessions.credentialId,
      to: r.accessCredentials.id,
    }),
    character: r.one.characters({
      from: r.accessSessions.characterId,
      to: r.characters.id,
    }),
  },
  characterSpendPlans: {
    campaign: r.one.campaigns({
      from: r.characterSpendPlans.campaignId,
      to: r.campaigns.id,
    }),
    character: r.one.characters({
      from: r.characterSpendPlans.characterId,
      to: r.characters.id,
    }),
    session: r.one.sessions({
      from: r.characterSpendPlans.sessionId,
      to: r.sessions.id,
    }),
  },
  communicationItems: {
    campaign: r.one.campaigns({
      from: r.communicationItems.campaignId,
      to: r.campaigns.id,
    }),
    session: r.one.sessions({
      from: r.communicationItems.sessionId,
      to: r.sessions.id,
    }),
    targets: r.many.communicationTargets({
      from: r.communicationItems.id,
      to: r.communicationTargets.itemId,
    }),
    refs: r.many.communicationRefs({
      from: r.communicationItems.id,
      to: r.communicationRefs.itemId,
    }),
    events: r.many.communicationEvents({
      from: r.communicationItems.id,
      to: r.communicationEvents.itemId,
    }),
  },
  communicationTargets: {
    character: r.one.characters({
      from: r.communicationTargets.characterId,
      to: r.characters.id,
    }),
    item: r.one.communicationItems({
      from: r.communicationTargets.itemId,
      to: r.communicationItems.id,
    }),
  },
  communicationRefs: {
    item: r.one.communicationItems({
      from: r.communicationRefs.itemId,
      to: r.communicationItems.id,
    }),
  },
  communicationEvents: {
    item: r.one.communicationItems({
      from: r.communicationEvents.itemId,
      to: r.communicationItems.id,
    }),
  },
  sessions: {
    campaign: r.one.campaigns({
      from: r.sessions.campaignId,
      to: r.campaigns.id,
    }),
    characterSpendPlans: r.many.characterSpendPlans({
      from: r.sessions.id,
      to: r.characterSpendPlans.sessionId,
    }),
    communicationItems: r.many.communicationItems({
      from: r.sessions.id,
      to: r.communicationItems.sessionId,
    }),
    xpTransactions: r.many.xpTransactions({
      from: r.sessions.id,
      to: r.xpTransactions.sessionId,
    }),
  },
  xpTransactions: {
    campaign: r.one.campaigns({
      from: r.xpTransactions.campaignId,
      to: r.campaigns.id,
    }),
    character: r.one.characters({
      from: r.xpTransactions.characterId,
      to: r.characters.id,
    }),
    session: r.one.sessions({
      from: r.xpTransactions.sessionId,
      to: r.sessions.id,
    }),
  },
  characterSkillChoices: {
    character: r.one.characters({
      from: r.characterSkillChoices.characterId,
      to: r.characters.id,
    }),
  },
  characterFeatChoices: {
    character: r.one.characters({
      from: r.characterFeatChoices.characterId,
      to: r.characters.id,
    }),
  },
  characterEquipment: {
    character: r.one.characters({
      from: r.characterEquipment.characterId,
      to: r.characters.id,
    }),
  },
  characterWeaponMasteries: {
    character: r.one.characters({
      from: r.characterWeaponMasteries.characterId,
      to: r.characters.id,
    }),
  },
  characterMetamagicChoices: {
    character: r.one.characters({
      from: r.characterMetamagicChoices.characterId,
      to: r.characters.id,
    }),
  },
  characterPactBladeBonds: {
    character: r.one.characters({
      from: r.characterPactBladeBonds.characterId,
      to: r.characters.id,
    }),
  },
}));
