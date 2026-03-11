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
});
