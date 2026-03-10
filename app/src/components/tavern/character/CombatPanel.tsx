import { Card, CardHeader } from "../ui/Card.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";

export interface CombatPanelProps {
  currentHp?: number;
  maxHp: number;
  armorClass: number;
  acBreakdown: string;
  initiative: number;
  speed: number;
  spellSaveDc?: number;
  proficiencyBonus: number;
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function CombatPanel({
  currentHp,
  maxHp,
  armorClass,
  acBreakdown,
  initiative,
  speed,
  spellSaveDc,
  proficiencyBonus,
}: CombatPanelProps) {
  return (
    <Card style={{ gridArea: "combat" }}>
      <CardHeader title="Combat" />
      <div className="space-y-4 p-4">
        {/* HP section */}
        <div>
          {currentHp !== undefined ? (
            <ProgressBar
              current={currentHp}
              max={maxHp}
              variant="hp"
              label="Hit Points"
            />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-soft">Hit Points</span>
                <span className="font-mono text-ink-soft">{maxHp} max</span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-[var(--radius-tag)] bg-border-light"
                role="progressbar"
                aria-valuenow={maxHp}
                aria-valuemin={0}
                aria-valuemax={maxHp}
                aria-label="Hit Points (max only)"
              >
                <div className="h-full w-full rounded-[var(--radius-tag)] bg-forest/40" />
              </div>
              <p className="text-[10px] text-ink-soft/60">
                Current HP tracking is not yet modeled
              </p>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBlock label="Armor Class" value={String(armorClass)} detail={acBreakdown} />
          <StatBlock label="Initiative" value={formatModifier(initiative)} />
          <StatBlock label="Speed" value={`${speed} ft`} />
          <StatBlock label="Prof. Bonus" value={formatModifier(proficiencyBonus)} />
          {spellSaveDc !== undefined && (
            <StatBlock label="Spell Save DC" value={String(spellSaveDc)} />
          )}
        </div>
      </div>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[var(--radius-ability)] bg-paper-deep p-2.5 text-center">
      <div className="text-[10px] font-semibold tracking-wider text-ink-soft uppercase">
        {label}
      </div>
      <div className="font-heading text-lg font-bold text-ink">{value}</div>
      {detail && (
        <div className="text-[10px] text-ink-soft/70">{detail}</div>
      )}
    </div>
  );
}
