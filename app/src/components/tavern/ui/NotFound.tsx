import { TAVERN_ROUTE_HEADING_ATTR } from "../layout/accessibility.ts";

export interface NotFoundProps {
  entity?: string;
}

export function NotFound({ entity = "Page" }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 font-mono text-6xl font-bold text-border">404</div>
      <h1
        className="mb-2 font-heading text-xl font-bold text-ink"
        {...{
          [TAVERN_ROUTE_HEADING_ATTR]: "true",
        }}
        tabIndex={-1}
      >
        {entity} Not Found
      </h1>
      <p className="max-w-sm text-sm text-ink-soft">
        The {entity.toLowerCase()} you are looking for does not exist or may
        have been moved.
      </p>
    </div>
  );
}
