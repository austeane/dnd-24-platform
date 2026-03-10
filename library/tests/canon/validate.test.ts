import { describe, expect, it } from "vitest";
import { validateCanonicalEntity } from "../../src/canon/index.ts";

describe("validateCanonicalEntity", () => {
  it("requires reviewStatus=llm-judgement for judgement-call entries", () => {
    expect(() =>
      validateCanonicalEntity(
        {
          type: "spell",
          id: "aa-spell-counterspell",
          slug: "counterspell-aa",
          name: "Counterspell",
          packId: "advanced-adventurers",
          sourceEdition: "aa-2024-adapted",
          sourceReference: {
            sourceTitle: "Advanced Adventurers",
            locator: "Wizard 3",
          },
          adaptationMode: "ported-with-judgement",
          reviewStatus: "reviewed",
          judgement: {
            isJudgementCall: true,
            judgementBasis: "Reapplies AA intent on top of 2024 SRD spell text.",
            derivedFrom: [
              {
                label: "SRD Counterspell",
                sourceEdition: "srd-2024",
                packId: "srd-5e-2024",
                entityId: "spell-counterspell",
                sourceReference: {
                  sourceTitle: "SRD 2024",
                  locator: "Counterspell",
                },
              },
              {
                label: "AA Counterspell",
                sourceEdition: "aa-2014",
                sourceReference: {
                  sourceTitle: "Advanced Adventurers",
                  locator: "Wizard 3",
                },
              },
            ],
          },
          level: 3,
          school: "Abjuration",
          classes: [],
          availability: "aa-universal",
          castingTime: "Reaction",
          ritual: false,
          range: "60 feet",
          components: {
            verbal: true,
            somatic: true,
          },
          duration: "Instantaneous",
          concentration: false,
        },
        "Test body",
        "counterspell-aa.md",
      ),
    ).toThrow(/reviewStatus=llm-judgement/);
  });

  it("accepts verified overlay spells with resolved metadata", () => {
    const entity = validateCanonicalEntity(
      {
        type: "spell",
        id: "aa-spell-mage-hand",
        slug: "mage-hand-aa",
        name: "Mage Hand",
        packId: "advanced-adventurers",
        sourceEdition: "aa-2024-adapted",
        sourceReference: {
          sourceTitle: "Advanced Adventurers",
          locator: "Arcane cantrips",
        },
        adaptationMode: "ported-unchanged",
        reviewStatus: "reviewed",
        judgement: null,
        level: 0,
        school: "Conjuration",
        classes: [],
        availability: "aa-universal",
        castingTime: "Action",
        ritual: false,
        range: "30 feet",
        components: {
          verbal: true,
          somatic: true,
        },
        duration: "1 minute",
        concentration: false,
        overlayTarget: {
          packId: "srd-5e-2024",
          entityId: "spell-mage-hand",
        },
        aaSourcePage: 42,
        aaSection: "Arcane cantrips",
        linkedAaAbilityIds: ["aa-ability-mage-hand-legerdemain"],
        interactionTypes: ["grant"],
      },
      "Test body",
      "mage-hand-aa.md",
    );

    expect(entity.type).toBe("spell");
    if (entity.type !== "spell") {
      return;
    }

    expect(entity.overlayTarget).toEqual({
      packId: "srd-5e-2024",
      entityId: "spell-mage-hand",
    });
    expect(entity.interactionTypes).toEqual(["grant"]);
  });
});
