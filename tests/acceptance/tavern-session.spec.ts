import { expect, test } from "@playwright/test";

test("Tavern session scenario renders across home and character tabs", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Campaign Platform" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Real AA Campaign" }),
  ).toBeVisible();
  await expect(page.getByText("5 characters · 1 session")).toBeVisible();

  await page.getByRole("link", { name: "T Tali" }).click();

  await expect(page.getByRole("heading", { name: "Tali" })).toBeVisible();
  await expect(page.getByText("Level 3")).toBeVisible();
  await expect(page.getByText("0 XP banked")).toBeVisible();
  await expect(
    page.getByText("Level Up and Long Rest are not yet available in this version."),
  ).toBeVisible();

  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(page.getByText("Casting Ability")).toBeVisible();
  await expect(page.getByText("Wisdom")).toBeVisible();
  await expect(page.getByText("Entangle")).toBeVisible();
  await expect(page.getByText("Hex")).toBeVisible();

  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(page.getByRole("heading", { name: "Attacks" })).toBeVisible();
  await expect(page.getByText("Leather Armor")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Journal" }).click();
  await expect(
    page.getByRole("heading", { name: "Spell notes for tonight" }),
  ).toBeVisible();
  await expect(page.getByText("Hex and Entangle came up in play.")).toBeVisible();

  await page.getByRole("link", { name: "Compendium" }).click();
  const searchbox = page.getByRole("searchbox", {
    name: "Search compendium entries",
  });
  await searchbox.fill("Hex");
  await expect(page.getByText("2 entries found")).toBeVisible();
  await page
    .getByRole("button", {
      name: /Hex AA universal-access overlay for Hex.*Advanced Adventurers/i,
    })
    .click();

  await expect(
    page.getByRole("heading", { name: "Hex", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("Advanced Adventurers")).toBeVisible();
  await expect(
    page.getByText(/Until the spell ends, you deal an extra 1d6 Necrotic damage/i),
  ).toBeVisible();
});
