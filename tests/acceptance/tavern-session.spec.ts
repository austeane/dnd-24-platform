import { expect, test, type Page } from "@playwright/test";

async function openCharacter(page: Page, name: string) {
  await page.getByRole("link", { name: `Open ${name}` }).click();
}

async function openTali(page: Page) {
  await openCharacter(page, "Tali");
}

test("seeded Tavern flow renders across home and character tabs", async ({
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
  await expect(page.getByRole("link", { name: /^Open / })).toHaveCount(5);

  await openTali(page);

  await expect(page.getByRole("heading", { name: "Tali" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tali" })).toBeFocused();
  await expect(page.getByText("Level 3")).toBeVisible();
  await expect(page.getByText("0 XP banked")).toBeVisible();
  await expect(page.getByText("15 / 19")).toBeVisible();
  await expect(page.getByText("Temporary HP: +2")).toBeVisible();
  await expect(
    page.getByText("Level Up and Long Rest are not yet available in this version."),
  ).toBeVisible();

  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(page.getByRole("heading", { name: "Spellbook" })).toBeFocused();
  await expect(page.getByText("Casting Ability")).toBeVisible();
  await expect(page.getByText("Wisdom")).toBeVisible();
  await expect(page.getByText("Entangle")).toBeVisible();
  await expect(page.getByText("Hex")).toBeVisible();

  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Attacks" })).toBeVisible();
  await expect(page.getByText("Leather Armor")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Journal" }).click();
  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Spell notes for tonight" }),
  ).toBeVisible();
  await expect(page.getByText("Hex and Entangle came up in play.")).toBeVisible();

  await page.getByRole("link", { name: "Compendium" }).click();
  await expect(page.getByRole("heading", { name: "Compendium" })).toBeFocused();
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

test("invalid character ids render the not-found state", async ({ page }) => {
  await page.goto("/characters/not-a-real-character");

  await expect(
    page.getByRole("heading", { name: "Character Not Found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Character Not Found" }),
  ).toBeFocused();
  await expect(
    page.getByText("The character you are looking for does not exist or may have been moved."),
  ).toBeVisible();
});

test("journal shows the empty state for characters without player updates", async ({
  page,
}) => {
  await page.goto("/");
  await openCharacter(page, "Vivennah");
  await expect(page.getByRole("heading", { name: "Vivennah" })).toBeFocused();
  await page.getByRole("link", { name: "Journal" }).click();

  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "No Journal Entries" }),
  ).toBeVisible();
  await expect(
    page.getByText("Your DM hasn't posted any updates yet. Check back during the next session."),
  ).toBeVisible();
});

test("skip links and route focus restoration are keyboard-accessible", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();

  await openTali(page);
  await expect(page.getByRole("heading", { name: "Tali" })).toBeFocused();

  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(page.getByRole("heading", { name: "Spellbook" })).toBeFocused();

  await page.getByRole("link", { name: "Compendium" }).click();
  await expect(page.getByRole("heading", { name: "Compendium" })).toBeFocused();
});

test("compendium filters persist in the URL across reloads", async ({
  page,
}) => {
  await page.goto("/");
  await openTali(page);
  await page.getByRole("link", { name: "Compendium" }).click();

  await page.getByRole("searchbox", { name: "Search compendium entries" }).fill("Hex");
  await page.getByRole("button", { name: "Filter type: Spell" }).click();
  await page
    .getByRole("button", { name: "Filter pack: Advanced Adventurers" })
    .click();
  await page
    .getByRole("button", {
      name: /Hex AA universal-access overlay for Hex.*Advanced Adventurers/i,
    })
    .click();

  await expect(page).toHaveURL(/q=Hex/);
  await expect(page).toHaveURL(/type=spell/);
  await expect(page).toHaveURL(/pack=advanced-adventurers/);
  await expect(page).toHaveURL(/entry=aa-spell-hex/);
  await expect(page).toHaveURL(/entryPack=advanced-adventurers/);

  await page.reload();

  await expect(page.getByRole("heading", { name: "Compendium" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hex", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("Advanced Adventurers")).toBeVisible();
});

for (const viewport of [
  { width: 480, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
]) {
  test.describe(`responsive Tavern pass at ${viewport.width}px`, () => {
    test.use({ viewport });

    test(`home and inventory remain usable at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "Campaign Platform" }),
      ).toBeVisible();
      await expect(page.getByText("5 characters · 1 session")).toBeVisible();

      await openTali(page);
      await expect(page.getByRole("heading", { name: "Tali" })).toBeVisible();

      await page.getByRole("link", { name: "Inventory" }).click();
      await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Attacks" })).toBeVisible();
      await expect(
        page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
      ).toBeVisible();
    });
  });
}
