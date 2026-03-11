import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  TAVERN_MAIN_CONTENT_ID,
  TAVERN_ROUTE_HEADING_SELECTOR,
} from "../components/tavern/layout/accessibility.ts";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "D&D Campaign Platform" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href={`#${TAVERN_MAIN_CONTENT_ID}`}
          onClick={() => {
            window.setTimeout(() => {
              document.getElementById(TAVERN_MAIN_CONTENT_ID)?.focus();
            }, 0);
          }}
          className="sr-only absolute left-4 top-4 z-50 rounded-[var(--radius-button)] bg-wood px-4 py-2 text-sm font-semibold text-cream shadow-[var(--shadow-tavern-md)] focus:not-sr-only"
        >
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const hasMountedRef = useRef(false);
  const lastAnnouncementRef = useRef("");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const shouldFocusRouteTarget = hasMountedRef.current || pathname !== "/";
    const previousAnnouncement = lastAnnouncementRef.current;
    let timeoutId: number | null = null;
    let attemptCount = 0;

    const focusRouteTarget = () => {
      const routeHeading = document.querySelector<HTMLElement>(
        TAVERN_ROUTE_HEADING_SELECTOR,
      );
      const announcementText = routeHeading?.textContent?.trim() || document.title;
      const routeHeadingReady =
        routeHeading !== null && announcementText !== previousAnnouncement;

      if (!routeHeadingReady && attemptCount < 20) {
        attemptCount += 1;
        timeoutId = window.setTimeout(focusRouteTarget, 50);
        return;
      }

      setAnnouncement(announcementText);
      lastAnnouncementRef.current = announcementText;
      hasMountedRef.current = true;

      if (!shouldFocusRouteTarget) {
        return;
      }

      (routeHeading ?? document.getElementById(TAVERN_MAIN_CONTENT_ID))?.focus();
    };

    focusRouteTarget();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Outlet />
    </>
  );
}
