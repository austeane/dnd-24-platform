import { TAVERN_ROUTE_HEADING_ATTR } from "../layout/accessibility.ts";

export interface NotFoundProps {
  entity?: string;
}

export function NotFound({ entity = "Page" }: NotFoundProps) {
  return (
    <div className="empty-state-shell">
      <div className="empty-state-icon font-mono text-6xl font-bold text-border">404</div>
      <h1
        className="empty-state-title"
        {...{
          [TAVERN_ROUTE_HEADING_ATTR]: "true",
        }}
        tabIndex={-1}
      >
        {entity} Not Found
      </h1>
      <p className="empty-state-copy">
        The {entity.toLowerCase()} you are looking for does not exist or may
        have been moved.
      </p>
    </div>
  );
}
