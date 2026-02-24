import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const basepath = import.meta.env.VITE_BASE_PATH
  ? import.meta.env.VITE_BASE_PATH.replace(/\/$/, "")
  : "/";

export function getRouter() {
  const router = createRouter({
    routeTree,
    basepath,
    scrollRestoration: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
