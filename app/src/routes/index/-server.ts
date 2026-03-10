import { createServerFn } from "@tanstack/react-start";
import type { HomeData } from "../../server/tavern/home.ts";

export type { HomeData };

// Variable-based path prevents Rollup from statically resolving the import
// during the client build. The handler only executes server-side at runtime.
const homeMod = "../../server/tavern/home" + ".ts";

export const fetchHomeData = createServerFn({ method: "GET" }).handler(
  (async () => {
    const { getHomeData } = await import(/* @vite-ignore */ homeMod);
    return getHomeData();
  }) as never,
) as unknown as () => Promise<HomeData>;
