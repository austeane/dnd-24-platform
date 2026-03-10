import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import {
  deleteEquipment,
  deleteSkillChoice,
  getActivePactBladeBond,
  listCharacterEquipment,
  listCharacterFeatChoices,
  listCharacterMetamagicChoices,
  listCharacterSkillChoices,
  listCharacterWeaponMasteries,
  recordEquipment,
  recordFeatChoice,
  recordMetamagicChoice,
  recordPactBladeBond,
  recordSkillChoice,
  recordWeaponMastery,
  unbondPactBlade,
  updateEquipment,
} from "./choice-state.ts";
import {
  commitSpendPlanChoices,
  recordEquipmentBulk,
  validateAndRecordMetamagicChoice,
  validateAndRecordPactBladeBond,
  validateAndRecordWeaponMastery,
  validateFeatChoice,
  validateSkillChoice,
} from "./choice-service.ts";
import { getCharacterRuntimeState } from "./character-state.ts";

async function getRosterCharacterId(slug: string): Promise<string> {
  const campaign = await getCampaignBySlug("real-aa-campaign");
  if (!campaign) {
    throw new Error("real-aa-campaign not found");
  }

  const roster = await listCampaignRoster(campaign.id);
  const character = roster.find((entry) => entry.slug === slug);
  if (!character) {
    throw new Error(`Character ${slug} not found in roster`);
  }

  return character.id;
}

describe("choice-state CRUD round-trips", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  // --- Skill Choices ---

  it("persists and retrieves skill choices for Ronan (Fighter)", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const skills = await listCharacterSkillChoices(characterId);
    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.skillName).sort()).toEqual(["Athletics", "Intimidation"]);
    expect(skills.find((s) => s.skillName === "Athletics")?.source).toBe("class");
    expect(skills.find((s) => s.skillName === "Athletics")?.sourceLabel).toBe("Fighter");
  });

  it("records a new skill choice and prevents duplicate via upsert", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const record = await recordSkillChoice({
      characterId,
      skillName: "Perception",
      source: "feat",
      sourceLabel: "Observant",
    });

    expect(record.skillName).toBe("Perception");
    expect(record.source).toBe("feat");

    // Upsert with different source should update
    const updated = await recordSkillChoice({
      characterId,
      skillName: "Perception",
      source: "background",
      sourceLabel: "Sage",
    });

    expect(updated.source).toBe("background");
    expect(updated.sourceLabel).toBe("Sage");

    const all = await listCharacterSkillChoices(characterId);
    expect(all.filter((s) => s.skillName === "Perception")).toHaveLength(1);
  });

  it("deletes a skill choice", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const deleted = await deleteSkillChoice(characterId, "Athletics");
    expect(deleted).toBe(true);

    const skills = await listCharacterSkillChoices(characterId);
    expect(skills.map((s) => s.skillName)).not.toContain("Athletics");
  });

  it("persists Oriana's Skilled feat skill choices (5 skills from class + feat)", async () => {
    const characterId = await getRosterCharacterId("oriana");

    const skills = await listCharacterSkillChoices(characterId);
    expect(skills).toHaveLength(5);
    expect(skills.map((s) => s.skillName).sort()).toEqual([
      "Arcana",
      "Deception",
      "Perception",
      "Persuasion",
      "Stealth",
    ]);

    const fromFeat = skills.filter((s) => s.source === "feat");
    expect(fromFeat).toHaveLength(3);
    expect(fromFeat.map((s) => s.skillName).sort()).toEqual(["Perception", "Persuasion", "Stealth"]);
  });

  // --- Feat Choices ---

  it("persists and retrieves feat choices for Ronan (Savage Attacker)", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const feats = await listCharacterFeatChoices(characterId);
    expect(feats).toHaveLength(1);
    expect(feats[0]?.featEntityId).toBe("feat:savage-attacker");
    expect(feats[0]?.featLabel).toBe("Savage Attacker");
  });

  it("persists Magic Initiate feat with sub-choices for Nara", async () => {
    const characterId = await getRosterCharacterId("nara");

    const feats = await listCharacterFeatChoices(characterId);
    expect(feats).toHaveLength(1);
    expect(feats[0]?.featEntityId).toBe("feat:magic-initiate");
    expect(feats[0]?.featLabel).toBe("Magic Initiate (Wizard)");
    expect(feats[0]?.subChoicesJson).toMatchObject({
      spellList: "wizard",
    });
  });

  it("persists Skilled feat with sub-choices for Oriana", async () => {
    const characterId = await getRosterCharacterId("oriana");

    const feats = await listCharacterFeatChoices(characterId);
    const skilled = feats.find((f) => f.featEntityId === "feat:skilled");
    expect(skilled).toBeDefined();
    expect(skilled?.subChoicesJson).toMatchObject({
      skillProficiencies: ["Perception", "Persuasion", "Stealth"],
    });
  });

  it("upserts feat choice with updated sub-choices", async () => {
    const characterId = await getRosterCharacterId("nara");

    await recordFeatChoice({
      characterId,
      featEntityId: "feat:magic-initiate",
      featPackId: "srd-5e-2024",
      featLabel: "Magic Initiate (Wizard)",
      subChoicesJson: {
        spellList: "wizard",
        cantrips: ["Fire Bolt", "Mage Hand"],
        leveledSpell: "Shield",
      },
      sourceLabel: "Background feat",
    });

    const feats = await listCharacterFeatChoices(characterId);
    const mi = feats.find((f) => f.featEntityId === "feat:magic-initiate");
    expect(mi?.subChoicesJson).toMatchObject({
      cantrips: ["Fire Bolt", "Mage Hand"],
      leveledSpell: "Shield",
    });
  });

  // --- Equipment ---

  it("persists and retrieves equipment for Ronan (4 items)", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const equipment = await listCharacterEquipment(characterId);
    expect(equipment).toHaveLength(4);

    const longsword = equipment.find((e) => e.itemEntityId === "equipment:longsword");
    expect(longsword?.equipped).toBe(true);
    expect(longsword?.slot).toBe("main-hand");
    expect(longsword?.quantity).toBe(1);

    const javelins = equipment.find((e) => e.itemEntityId === "equipment:javelin");
    expect(javelins?.equipped).toBe(false);
    expect(javelins?.slot).toBe("carried");
    expect(javelins?.quantity).toBe(4);
  });

  it("updates equipment equipped state and slot", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const equipment = await listCharacterEquipment(characterId);
    const javelin = equipment.find((e) => e.itemEntityId === "equipment:javelin");
    expect(javelin).toBeDefined();

    const updated = await updateEquipment({
      id: javelin!.id,
      equipped: true,
      slot: "main-hand",
      quantity: 3,
    });

    expect(updated?.equipped).toBe(true);
    expect(updated?.slot).toBe("main-hand");
    expect(updated?.quantity).toBe(3);
  });

  it("deletes equipment", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const equipment = await listCharacterEquipment(characterId);
    const javelin = equipment.find((e) => e.itemEntityId === "equipment:javelin");

    const deleted = await deleteEquipment(javelin!.id);
    expect(deleted).toBe(true);

    const remaining = await listCharacterEquipment(characterId);
    expect(remaining).toHaveLength(3);
    expect(remaining.find((e) => e.itemEntityId === "equipment:javelin")).toBeUndefined();
  });

  it("records new equipment item", async () => {
    const characterId = await getRosterCharacterId("tali");

    const record = await recordEquipment({
      characterId,
      itemEntityId: "equipment:herbalism-kit",
      itemLabel: "Herbalism Kit",
      quantity: 1,
      equipped: false,
      slot: "stowed",
    });

    expect(record.itemEntityId).toBe("equipment:herbalism-kit");
    expect(record.itemLabel).toBe("Herbalism Kit");
    expect(record.equipped).toBe(false);
    expect(record.slot).toBe("stowed");
  });

  // --- Weapon Masteries ---

  it("persists and retrieves weapon masteries for Ronan (2 masteries)", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const masteries = await listCharacterWeaponMasteries(characterId);
    expect(masteries).toHaveLength(2);

    const longswordMastery = masteries.find((m) => m.weaponEntityId === "equipment:longsword");
    expect(longswordMastery?.masteryProperty).toBe("Sap");

    const javelinMastery = masteries.find((m) => m.weaponEntityId === "equipment:javelin");
    expect(javelinMastery?.masteryProperty).toBe("Slow");
  });

  it("upserts weapon mastery with changed property", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await recordWeaponMastery({
      characterId,
      weaponEntityId: "equipment:longsword",
      weaponLabel: "Longsword",
      masteryProperty: "Topple",
    });

    const masteries = await listCharacterWeaponMasteries(characterId);
    const longsword = masteries.find((m) => m.weaponEntityId === "equipment:longsword");
    expect(longsword?.masteryProperty).toBe("Topple");
  });

  // --- Metamagic Choices ---

  it("persists and retrieves metamagic choices for Nara (Subtle + Twinned)", async () => {
    const characterId = await getRosterCharacterId("nara");

    const choices = await listCharacterMetamagicChoices(characterId);
    expect(choices).toHaveLength(2);
    expect(choices.map((c) => c.metamagicOption).sort()).toEqual(["Subtle Spell", "Twinned Spell"]);
  });

  it("upserts metamagic choice with updated source label", async () => {
    const characterId = await getRosterCharacterId("nara");

    await recordMetamagicChoice({
      characterId,
      metamagicOption: "Subtle Spell",
      sourceLabel: "Sorcerer 3",
    });

    const choices = await listCharacterMetamagicChoices(characterId);
    const subtle = choices.find((c) => c.metamagicOption === "Subtle Spell");
    expect(subtle?.sourceLabel).toBe("Sorcerer 3");
  });

  // --- Pact Blade Bonds ---

  it("persists and retrieves active pact blade bond for Oriana", async () => {
    const characterId = await getRosterCharacterId("oriana");

    const bond = await getActivePactBladeBond(characterId);
    expect(bond).not.toBeNull();
    expect(bond?.weaponLabel).toBe("Pact Weapon (conjured)");
    expect(bond?.isMagicWeapon).toBe(false);
  });

  it("unbonds a pact blade and creates a new bond", async () => {
    const characterId = await getRosterCharacterId("oriana");

    const original = await getActivePactBladeBond(characterId);
    expect(original).not.toBeNull();

    const unbonded = await unbondPactBlade(original!.id);
    expect(unbonded?.unbondedAt).not.toBeNull();

    const active = await getActivePactBladeBond(characterId);
    expect(active).toBeNull();

    const newBond = await recordPactBladeBond({
      characterId,
      weaponEntityId: "equipment:magic-longsword",
      weaponLabel: "Flame Tongue Longsword",
      isMagicWeapon: true,
    });

    expect(newBond.weaponLabel).toBe("Flame Tongue Longsword");
    expect(newBond.isMagicWeapon).toBe(true);

    const retrievedBond = await getActivePactBladeBond(characterId);
    expect(retrievedBond?.id).toBe(newBond.id);
  });

  // --- Characters with no choice data ---

  it("returns empty arrays for characters with no specific choices", async () => {
    const characterId = await getRosterCharacterId("tali");

    const feats = await listCharacterFeatChoices(characterId);
    expect(feats).toHaveLength(0);

    const masteries = await listCharacterWeaponMasteries(characterId);
    expect(masteries).toHaveLength(0);

    const metamagic = await listCharacterMetamagicChoices(characterId);
    expect(metamagic).toHaveLength(0);

    const bond = await getActivePactBladeBond(characterId);
    expect(bond).toBeNull();
  });
});

describe("choice-service orchestration", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("validates skill choice rejects duplicates", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const result = await validateSkillChoice({
      characterId,
      skillName: "Athletics",
      source: "class",
      sourceLabel: "Fighter",
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Athletics");
  });

  it("validates skill choice accepts new skills", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const result = await validateSkillChoice({
      characterId,
      skillName: "Perception",
      source: "feat",
      sourceLabel: "Observant",
    });

    expect(result.valid).toBe(true);
  });

  it("validates feat choice against character sources", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const result = await validateFeatChoice({
      characterId,
      featEntityId: "feat:savage-attacker",
      featLabel: "Savage Attacker",
      sourceLabel: "Background feat",
    });

    expect(result.valid).toBe(true);

    const invalid = await validateFeatChoice({
      characterId,
      featEntityId: "feat:magic-initiate",
      featLabel: "Magic Initiate",
      sourceLabel: "Background feat",
    });

    expect(invalid.valid).toBe(false);
  });

  it("records equipment in bulk", async () => {
    const characterId = await getRosterCharacterId("nara");

    const items = await recordEquipmentBulk(characterId, [
      {
        characterId,
        itemEntityId: "equipment:dagger",
        itemLabel: "Dagger",
        quantity: 2,
        equipped: true,
        slot: "main-hand",
      },
      {
        characterId,
        itemEntityId: "equipment:component-pouch",
        itemLabel: "Component Pouch",
        quantity: 1,
        equipped: false,
        slot: "carried",
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.itemLabel).toBe("Dagger");
    expect(items[1]?.itemLabel).toBe("Component Pouch");

    const all = await listCharacterEquipment(characterId);
    expect(all).toHaveLength(2);
  });

  it("validateAndRecordWeaponMastery rejects characters without the feature", async () => {
    const characterId = await getRosterCharacterId("tali");

    await expect(
      validateAndRecordWeaponMastery({
        characterId,
        weaponEntityId: "equipment:quarterstaff",
        weaponLabel: "Quarterstaff",
        masteryProperty: "Topple",
      }),
    ).rejects.toThrow("Weapon Mastery");
  });

  it("validateAndRecordMetamagicChoice rejects characters without the feature", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await expect(
      validateAndRecordMetamagicChoice({
        characterId,
        metamagicOption: "Quickened Spell",
        sourceLabel: "Fighter 2",
      }),
    ).rejects.toThrow("Metamagic");
  });

  it("validateAndRecordPactBladeBond replaces active bond", async () => {
    const characterId = await getRosterCharacterId("oriana");

    const original = await getActivePactBladeBond(characterId);
    expect(original).not.toBeNull();

    const newBond = await validateAndRecordPactBladeBond({
      characterId,
      weaponLabel: "Hexblade Rapier",
      isMagicWeapon: true,
    });

    expect(newBond.weaponLabel).toBe("Hexblade Rapier");

    const active = await getActivePactBladeBond(characterId);
    expect(active?.id).toBe(newBond.id);

    // Original bond should be unbonded
    const oldBond = await getActivePactBladeBond(characterId);
    expect(oldBond?.id).not.toBe(original?.id);
  });

  it("validateAndRecordPactBladeBond rejects characters without the feature", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await expect(
      validateAndRecordPactBladeBond({
        characterId,
        weaponLabel: "Pact Weapon",
      }),
    ).rejects.toThrow("Pact of the Blade");
  });

  it("commitSpendPlanChoices records multiple choice types at once", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    const result = await commitSpendPlanChoices("test-plan", characterId, {
      skills: [
        {
          characterId,
          skillName: "Survival",
          source: "class",
          sourceLabel: "Fighter 3",
        },
      ],
      equipment: [
        {
          characterId,
          itemEntityId: "equipment:potion-healing",
          itemLabel: "Potion of Healing",
          quantity: 2,
          equipped: false,
          slot: "stowed",
        },
      ],
    });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]?.skillName).toBe("Survival");
    expect(result.equipment).toHaveLength(1);
    expect(result.equipment[0]?.itemLabel).toBe("Potion of Healing");
  });
});

describe("choice-state runtime projection", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("skill choices appear in runtime proficiency state for Ronan", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");
    const state = await getCharacterRuntimeState(characterId);

    expect(state).not.toBeNull();
    const athleticsSkill = state?.skillState.skills.find((s) => s.skillName === "Athletics");
    expect(athleticsSkill?.proficient).toBe(true);
  });

  it("Oriana's Skilled feat skill choices appear in runtime proficiency state", async () => {
    const characterId = await getRosterCharacterId("oriana");
    const state = await getCharacterRuntimeState(characterId);

    expect(state).not.toBeNull();

    for (const skillName of ["Perception", "Persuasion", "Stealth"]) {
      const skill = state?.skillState.skills.find((s) => s.skillName === skillName);
      expect(skill?.proficient, `${skillName} should be proficient`).toBe(true);
    }
  });

  it("Nara's metamagic choices appear in runtime trait state", async () => {
    const characterId = await getRosterCharacterId("nara");
    const state = await getCharacterRuntimeState(characterId);

    expect(state).not.toBeNull();
    const metamagicTrait = state?.traits.find((t) => t.name.includes("Metamagic"));
    expect(metamagicTrait).toBeDefined();
  });

  it("equipment changes reflect in runtime state", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    // Add a new equipped item
    await recordEquipment({
      characterId,
      itemEntityId: "equipment:healing-potion",
      itemLabel: "Potion of Healing",
      quantity: 1,
      equipped: false,
      slot: "stowed",
    });

    const state = await getCharacterRuntimeState(characterId);
    expect(state).not.toBeNull();
    // Runtime should still compute without error
    expect(state?.level).toBe(2);
  });
});
