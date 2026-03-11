import { Card, CardHeader } from "../ui/Card.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";

export interface CombatPanelProps {
  currentHp?: number;
  tempHp?: number;
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
  tempHp = 0,
  maxHp,
  armorClass,
  acBreakdown,
  initiative,
  speed,
  spellSaveDc,
  proficiencyBonus,
}: CombatPanelProps) {
  const resolvedCurrentHp = currentHp ?? maxHp;

  return (
    <Card style={{ gridArea: "combat" }}>
      <CardHeader title="Combat" />
      <div className="space-y-4 p-4">
        <div>
          <ProgressBar
            current={resolvedCurrentHp}
            max={maxHp}
            variant="hp"
            label="Hit Points"
          />
          {tempHp > 0 && (
            <p className="mt-1 text-[11px] font-medium text-sky">
              Temporary HP: +{tempHp}
            </p>
          )}
        </div>

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
