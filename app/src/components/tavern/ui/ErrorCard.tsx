import { TAVERN_ROUTE_HEADING_ATTR } from "../layout/accessibility.ts";

export interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="error-card">
      <div className="empty-state-icon text-3xl" aria-hidden="true">&#9888;</div>
      <h1
        className="empty-state-title"
        {...{
          [TAVERN_ROUTE_HEADING_ATTR]: "true",
        }}
        tabIndex={-1}
      >
        {title}
      </h1>
      <p className="empty-state-copy">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-outline"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
