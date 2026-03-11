import { createServerFn } from "@tanstack/react-start";
import { getHomeData } from "../../server/tavern/home.ts";
import type { HomeData } from "../../server/tavern/home.ts";

export type { HomeData };

export const fetchHomeData = createServerFn({ method: "GET" }).handler(
  async () => getHomeData(),
);
