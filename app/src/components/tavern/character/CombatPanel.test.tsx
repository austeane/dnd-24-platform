import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CombatPanel } from "./CombatPanel.tsx";

afterEach(cleanup);

describe("CombatPanel", () => {
  it("renders current and temporary hit points without the max-only fallback copy", () => {
    render(
      <CombatPanel
        currentHp={15}
        tempHp={2}
        maxHp={19}
        armorClass={14}
        acBreakdown="Leather Armor +2"
        initiative={3}
        speed={35}
        spellSaveDc={13}
        proficiencyBonus={2}
        conditions={[]}
      />,
    );

    expect(
      screen.getByRole("progressbar", { name: "Hit Points" }),
    ).toHaveAttribute("aria-valuenow", "15");
    expect(screen.getByText("15 / 19")).toBeInTheDocument();
    expect(screen.getByText("Temporary HP: +2")).toBeInTheDocument();
    expect(
      screen.queryByText("Current HP tracking is not yet modeled"),
    ).not.toBeInTheDocument();
  });

  it("renders a dedicated concentration toggle instead of a generic clear chip", () => {
    render(
      <CombatPanel
        currentHp={15}
        tempHp={0}
        maxHp={19}
        armorClass={14}
        acBreakdown="Leather Armor +2"
        initiative={3}
        speed={35}
        spellSaveDc={13}
        proficiencyBonus={2}
        editable
        conditions={[
          {
            id: "condition-concentration",
            name: "concentration",
            note: "Entangle",
            sourceCreature: null,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "End Concentration" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Clear concentration/i }),
    ).not.toBeInTheDocument();
  });
});
