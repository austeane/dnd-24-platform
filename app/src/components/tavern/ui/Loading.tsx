export interface LoadingProps {
  label?: string;
}

export function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-16" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-ember" />
        <span className="font-body text-sm text-ink-soft">{label}</span>
      </div>
    </div>
  );
}
