import { createFileRoute } from "@tanstack/react-router";
import { HomePageView } from "../components/tavern/home/HomePageView.tsx";
import { TavernLayout } from "../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../components/tavern/layout/TavernNav.tsx";
import { ErrorCard } from "../components/tavern/ui/ErrorCard.tsx";
import { Loading } from "../components/tavern/ui/Loading.tsx";
import { fetchHomeData } from "./index/-server.ts";
import { toHomePageProps } from "./index/-adapters.ts";

export const Route = createFileRoute("/")({
  loader: async () => {
    const data = await fetchHomeData();
    return toHomePageProps(data);
  },
  pendingComponent: HomePending,
  errorComponent: HomeError,
  component: HomePage,
});

function HomePage() {
  const { campaigns } = Route.useLoaderData();

  return (
    <>
      <TavernNav />
      <HomePageView campaigns={campaigns} />
    </>
  );
}

function HomePending() {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <Loading label="Loading campaigns..." />
      </TavernLayout>
    </>
  );
}

function HomeError({ error }: { error: Error }) {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <ErrorCard
          title="Failed to load campaigns"
          message={error.message}
        />
      </TavernLayout>
    </>
  );
}
