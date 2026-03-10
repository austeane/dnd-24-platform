import { Card } from "../ui/Card.tsx";
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
    <Card className="p-4">
      <ProgressBar
        current={totalSpent}
        max={totalEarned}
        variant="xp"
        label="Experience Points"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <span>
          {banked} XP banked
        </span>
        <span className="font-mono">
          {totalSpent} / {totalEarned} spent
        </span>
      </div>
    </Card>
  );
}
