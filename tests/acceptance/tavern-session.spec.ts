import { expect, test, type Page } from "@playwright/test";
import {
  seedTavernSessionDatabase,
  tavernAccessPasswords,
} from "../../scripts/seed-tavern-session.ts";

const databaseUrl = process.env.DATABASE_TEST_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_TEST_URL is required for Tavern acceptance tests.");
}

test.beforeEach(async () => {
  await seedTavernSessionDatabase({ databaseUrl, closeClient: false });
});

async function openCharacter(page: Page, name: string) {
  await page.getByRole("link", { name: `Open ${name}` }).click();
}

async function loginAsPlayer(
  page: Page,
  name: string,
  password: string,
) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Campaign Platform" }),
  ).toBeVisible();
  await openCharacter(page, name);
  await expect(page.getByRole("heading", { name: "Campaign Access" })).toBeVisible();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Enter Campaign" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function loginAsDm(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "DM Access" }).click();
  await expect(page.getByRole("heading", { name: "Campaign Access" })).toBeVisible();
  await page.getByLabel("Password").fill(tavernAccessPasswords.dm);
  await page.getByRole("button", { name: "Enter Campaign" }).click();
  await expect(page.getByRole("heading", { name: "DM Dashboard" })).toBeVisible();
}

test("player access can mutate HP, conditions, slots, resources, and rests", async ({
  page,
}) => {
  await loginAsPlayer(
    page,
    "Tali",
    tavernAccessPasswords.playerBySlug.tali,
  );

  await expect(page.getByRole("heading", { name: "Tali" })).toBeFocused();
  await expect(page.getByText("15 / 19")).toBeVisible();
  await expect(page.getByText("Temporary HP: +2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Level Up" })).toBeVisible();

  await page.getByLabel("HP Amount").fill("3");
  await page.getByRole("button", { name: "Damage" }).click();
  await expect(page.getByText("14 / 19")).toBeVisible();

  await page.getByLabel("Temp HP").fill("5");
  await page.getByRole("button", { name: "Gain Temp" }).click();
  await expect(page.getByText("Temporary HP: +5")).toBeVisible();

  await page.getByLabel("Condition").selectOption("charmed");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("button", { name: /Clear charmed/i })).toBeVisible();
  await page.getByRole("button", { name: /Clear charmed/i }).click();
  await expect(page.getByRole("button", { name: /Clear charmed/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Start Concentration" }).click();
  await expect(page.getByRole("button", { name: "End Concentration" })).toBeVisible();
  await page.getByLabel("Condition").selectOption("incapacitated");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("button", { name: /Clear incapacitated/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Concentration" })).toBeVisible();
  await page.getByRole("button", { name: /Clear incapacitated/i }).click();
  await expect(page.getByRole("button", { name: /Clear incapacitated/i })).toHaveCount(0);

  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(page.getByRole("heading", { name: "Spellbook" })).toBeFocused();
  await page.getByRole("button", { name: "Spend" }).click();
  await expect(
    page.getByRole("group", { name: "2 of 3 spell slots available" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeFocused();
  await expect(
    page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Spend" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Wild Shape: 1 of 2" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Character" }).click();
  await page.getByRole("button", { name: "Short Rest" }).click();
  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Character" }).click();
  await page.getByRole("button", { name: "Long Rest" }).click();
  await expect(page.getByText("19 / 19")).toBeVisible();
  await expect(page.getByText("Temporary HP: +5")).toHaveCount(0);

  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(
    page.getByRole("group", { name: "3 of 3 spell slots available" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Spellbook" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "3 of 3 spell slots available" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Character" }).click();
  await expect(page.getByText("19 / 19")).toBeVisible();
});

test("player access is scoped to one character", async ({ page }) => {
  await loginAsPlayer(
    page,
    "Tali",
    tavernAccessPasswords.playerBySlug.tali,
  );

  await page.goto("/");
  await openCharacter(page, "Vivennah");

  await expect(page.getByRole("heading", { name: "Campaign Access" })).toBeVisible();
  await expect(page.getByText("Real AA Campaign · Vivennah")).toBeVisible();
  await expect(page).toHaveURL(/characterId=/);
});

test("dm access can create sessions, publish updates, award XP, reset passwords, and launch level-up", async ({
  page,
}) => {
  await loginAsDm(page);

  await page.getByLabel("New Session Title").fill("Session 2 Live");
  await page.getByRole("button", { name: "Create Session 2" }).click();
  await expect(page.getByText("Session created.")).toBeVisible();

  await page.getByLabel("Journal Title").fill("Rule of the Lantern");
  await page.getByLabel("Journal Body").fill(
    "Lantern warding now applies until dawn.",
  );
  await page.getByRole("button", { name: "Publish Journal Note" }).click();
  await expect(page.getByText("Journal entry published.")).toBeVisible();
  await expect(page.getByText("Rule of the Lantern")).toBeVisible();

  await page.getByRole("button", { name: "Award XP" }).click();
  await expect(page.getByText("XP awarded.")).toBeVisible();

  await page.getByLabel("Player Character").selectOption({ label: "Vivennah" });
  await page.getByLabel("New Player Password").fill("vivennah-reset-pass");
  await page.getByRole("button", { name: "Save Player Password" }).click();
  await expect(page.getByText("Player password updated.")).toBeVisible();
  await expect(page.getByText("Active Access Sessions")).toBeVisible();

  await page.getByRole("link", { name: "Open Level Up for Tali" }).click();
  await expect(page.getByRole("heading", { name: "Level Up" })).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText(/Total cost:/)).toBeVisible();
  await page.getByRole("button", { name: "Commit Level Up" }).click();

  await expect(page.getByRole("heading", { name: "Tali" })).toBeVisible();
  await expect(page.getByText("Level 4")).toBeVisible();
  await page.getByRole("link", { name: "Journal" }).click();
  await expect(page.getByText("Rule of the Lantern")).toBeVisible();
});

test("invalid character ids render the not-found state", async ({ page }) => {
  await page.goto("/characters/not-a-real-character");

  await expect(
    page.getByRole("heading", { name: "Character Not Found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Character Not Found" }),
  ).toBeFocused();
});

test("journal shows the empty state for Vivennah after player login", async ({
  page,
}) => {
  await loginAsPlayer(
    page,
    "Vivennah",
    tavernAccessPasswords.playerBySlug.vivennah,
  );
  await page.getByRole("link", { name: "Journal" }).click();

  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No Journal Entries" }),
  ).toBeVisible();
});

test("skip links and route focus restoration stay keyboard-accessible through access and tabs", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();

  await openCharacter(page, "Tali");
  await expect(page.getByRole("heading", { name: "Campaign Access" })).toBeFocused();
  await page.getByLabel("Password").fill(tavernAccessPasswords.playerBySlug.tali);
  await page.getByRole("button", { name: "Enter Campaign" }).click();

  await expect(page.getByRole("heading", { name: "Tali" })).toBeFocused();
  await page.getByRole("link", { name: "Spellbook" }).click();
  await expect(page.getByRole("heading", { name: "Spellbook" })).toBeFocused();
  await page.getByRole("link", { name: "Compendium" }).click();
  await expect(page.getByRole("heading", { name: "Compendium" })).toBeFocused();
});

test("compendium filters persist in the URL across reloads", async ({
  page,
}) => {
  await loginAsPlayer(
    page,
    "Tali",
    tavernAccessPasswords.playerBySlug.tali,
  );
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
});

for (const viewport of [
  { width: 480, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
]) {
  test.describe(`responsive player flow at ${viewport.width}px`, () => {
    test.use({ viewport });

    test(`home, access, and inventory remain usable at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Campaign Platform" }),
      ).toBeVisible();
      await expect(page.getByText("5 characters · 1 session")).toBeVisible();

      await openCharacter(page, "Tali");
      await page.getByLabel("Password").fill(tavernAccessPasswords.playerBySlug.tali);
      await page.getByRole("button", { name: "Enter Campaign" }).click();
      await expect(page.getByRole("heading", { name: "Tali" })).toBeVisible();

      await page.getByRole("link", { name: "Inventory" }).click();
      await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
      await expect(
        page.getByRole("progressbar", { name: "Wild Shape: 2 of 2" }),
      ).toBeVisible();
    });
  });
}

test.describe("responsive dm flow at 1024px", () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test("dashboard remains usable at desktop width", async ({ page }) => {
    await loginAsDm(page);
    await expect(page.getByRole("heading", { name: "DM Dashboard" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Session", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();
  });
});
