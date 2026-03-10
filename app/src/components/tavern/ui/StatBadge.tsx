export interface StatBadgeProps {
  label: string;
  variant?: "default" | "ember" | "forest" | "sky";
}

export function StatBadge({ label, variant = "default" }: StatBadgeProps) {
  const variants = {
    default: "bg-parchment text-ink-soft",
    ember: "bg-ember/10 text-ember",
    forest: "bg-forest/10 text-forest",
    sky: "bg-sky/10 text-sky",
  };

  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-tag)] px-2.5 py-0.5 font-mono text-xs font-medium ${variants[variant]}`}
    >
      {label}
    </span>
  );
}
