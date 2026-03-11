import { act, render } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import type { TavernFixtureBundle } from "./fixtures.ts";
import {
  TavernCharacterFixtureScene,
  TavernCompendiumFixtureScene,
  TavernHomeFixtureScene,
  TavernInventoryFixtureScene,
  TavernJournalFixtureScene,
  TavernSpellbookFixtureScene,
} from "./scenes.tsx";

export type TavernFixtureRoute =
  | "home"
  | "character"
  | "spellbook"
  | "inventory"
  | "journal"
  | "compendium";

const fixtureCharacterIdParam = "$characterId";

export async function renderTavernFixtureApp(options: {
  fixture: TavernFixtureBundle;
  route?: TavernFixtureRoute;
}) {
  const { fixture, route = "home" } = options;
  const characterId = fixture.shell.character.id;

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <>
        <TavernNav />
        <TavernHomeFixtureScene fixture={fixture.home} />
      </>
    ),
  });

  const characterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: `characters/${fixtureCharacterIdParam}`,
    component: () => (
      <>
        <TavernNav
          campaignName={fixture.shell.campaign.name}
          characterId={characterId}
        />
        <TavernLayout>
          <Outlet />
        </TavernLayout>
      </>
    ),
  });

  const characterIndexRoute = createRoute({
    getParentRoute: () => characterRoute,
    path: "/",
    component: () => <TavernCharacterFixtureScene fixture={fixture.shell} />,
  });

  const spellbookRoute = createRoute({
    getParentRoute: () => characterRoute,
    path: "spellbook",
    component: () => <TavernSpellbookFixtureScene fixture={fixture.shell.spellbook} />,
  });

  const inventoryRoute = createRoute({
    getParentRoute: () => characterRoute,
    path: "inventory",
    component: () => <TavernInventoryFixtureScene fixture={fixture.inventory} />,
  });

  const journalRoute = createRoute({
    getParentRoute: () => characterRoute,
    path: "journal",
    component: () => <TavernJournalFixtureScene fixture={fixture.journal} />,
  });

  const compendiumRoute = createRoute({
    getParentRoute: () => characterRoute,
    path: "compendium",
    component: () => <TavernCompendiumFixtureScene fixture={fixture.compendium} />,
  });

  const routeTree = rootRoute.addChildren([
    homeRoute,
    characterRoute.addChildren([
      characterIndexRoute,
      spellbookRoute,
      inventoryRoute,
      journalRoute,
      compendiumRoute,
    ]),
  ]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [resolveInitialPath(route, characterId)],
    }),
  });

  const rendered = render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });

  return rendered;
}

function resolveInitialPath(route: TavernFixtureRoute, characterId: string): string {
  switch (route) {
    case "home":
      return "/";
    case "character":
      return `/characters/${characterId}`;
    case "spellbook":
      return `/characters/${characterId}/spellbook`;
    case "inventory":
      return `/characters/${characterId}/inventory`;
    case "journal":
      return `/characters/${characterId}/journal`;
    case "compendium":
      return `/characters/${characterId}/compendium`;
  }
}
