export interface StatBadgeProps {
  label: string;
  variant?: "default" | "ember" | "forest" | "sky";
}

export function StatBadge({ label, variant = "default" }: StatBadgeProps) {
  const variants = {
    default: "bg-parchment text-ink-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
    ember:
      "bg-ember text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
    forest:
      "bg-forest/12 text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    sky: "bg-sky/12 text-sky shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-tag)] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.04em] ${variants[variant]}`}
    >
      {label}
    </span>
  );
}
