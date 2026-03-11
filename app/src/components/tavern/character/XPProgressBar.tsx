import { ProgressBar } from "../ui/ProgressBar.tsx";

export interface XPProgressBarProps {
  totalEarned: number;
  totalSpent: number;
  banked: number;
  progressionMode: string;
}

export function XPProgressBar({
  totalEarned,
  totalSpent,
  banked,
  progressionMode,
}: XPProgressBarProps) {
  if (progressionMode === "standard") {
    return null;
  }

  return (
    <section className="xp-section animate-fade-up" style={{ ["--delay" as string]: "0.05s" }}>
      <div className="xp-label">Experience</div>
      <div className="xp-bar-wrap">
        <ProgressBar
          current={totalSpent}
          max={totalEarned}
          variant="xp"
          showNumbers={false}
        />
        <div className="xp-numbers">
          <span>{banked} XP banked</span>
          <span>
            {totalSpent} / {totalEarned} spent
          </span>
        </div>
      </div>
    </section>
  );
}
