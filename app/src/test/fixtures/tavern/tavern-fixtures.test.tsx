import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderTavernFixtureApp, tavernFixtureScenarios } from "./index.ts";

afterEach(cleanup);

describe("tavern fixture app", () => {
  it("renders a multi-campaign home view without the DB-backed Tavern scenario", async () => {
    await renderTavernFixtureApp({
      fixture: tavernFixtureScenarios.multiCampaignHome,
      route: "home",
    });

    expect(
      screen.getByRole("heading", { name: "Campaign Platform" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Real AA Campaign" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Storm Archives" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 characters · 1 session")).toBeInTheDocument();
    expect(screen.getByText("2 characters · 4 sessions")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Tali" }),
    ).toHaveAttribute("href", "/characters/fixture-character-tali");
    expect(
      screen.getByRole("link", { name: "Open Mira" }),
    ).toHaveAttribute(
      "href",
      "/campaigns/storm-archives/access?next=%2Fcharacters%2Ffixture-character-mira&role=player&characterId=fixture-character-mira",
    );
  });

  it("renders the damaged HP overview state without seeded runtime data", async () => {
    await renderTavernFixtureApp({
      fixture: tavernFixtureScenarios.default,
      route: "character",
    });

    expect(screen.getByRole("heading", { name: "Tali" })).toBeInTheDocument();
    expect(screen.getByText("15 / 19")).toBeInTheDocument();
    expect(screen.getByText("Temporary HP: +2")).toBeInTheDocument();
    expect(screen.getByText("0 XP banked")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { current: "page", name: "Character" }),
    ).toBeInTheDocument();
  });

  it("renders the empty journal state without communications fixtures in Postgres", async () => {
    await renderTavernFixtureApp({
      fixture: tavernFixtureScenarios.emptyJournal,
      route: "journal",
    });

    expect(screen.getByRole("heading", { name: "Journal" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No Journal Entries" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your DM hasn't posted any updates yet. Check back during the next session.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { current: "page", name: "Journal" }),
    ).toBeInTheDocument();
  });

  it("renders a filtered compendium detail state without loader wiring", async () => {
    await renderTavernFixtureApp({
      fixture: tavernFixtureScenarios.filteredCompendium,
      route: "compendium",
    });

    expect(
      screen.getByRole("heading", { name: "Compendium" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Back to list/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hex", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Advanced Adventurers")).toBeInTheDocument();
    expect(
      screen.getByText(/extra 1d6 Necrotic damage/i),
    ).toBeInTheDocument();
  });
});
