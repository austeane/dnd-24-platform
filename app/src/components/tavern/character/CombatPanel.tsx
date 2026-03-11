import { Button } from "../ui/Button.tsx";
import { Card, CardHeader } from "../ui/Card.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";

export interface CombatConditionProps {
  id: string;
  name: string;
  note: string | null;
  sourceCreature: string | null;
}

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
  conditions: CombatConditionProps[];
  editable?: boolean;
  onApplyDamage?: (amount: number) => Promise<void>;
  onHeal?: (amount: number) => Promise<void>;
  onGainTempHp?: (amount: number) => Promise<void>;
  onClearTempHp?: () => Promise<void>;
  onShortRest?: () => Promise<void>;
  onLongRest?: () => Promise<void>;
  onApplyCondition?: (
    conditionName: "charmed" | "concentration" | "incapacitated",
  ) => Promise<void>;
  onRemoveCondition?: (conditionId: string) => Promise<void>;
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function readPositiveNumber(
  form: HTMLFormElement | null,
  fieldName: string,
): number | null {
  if (!form) {
    return null;
  }

  const value = Number(new FormData(form).get(fieldName));
  if (!Number.isFinite(value) || value < 1) {
    return null;
  }

  return value;
}

function readConditionName(
  form: HTMLFormElement | null,
): "charmed" | "incapacitated" | null {
  if (!form) {
    return null;
  }

  const value = new FormData(form).get("conditionName");
  if (value === "charmed" || value === "incapacitated") {
    return value;
  }

  return null;
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
  conditions,
  editable = false,
  onApplyDamage,
  onHeal,
  onGainTempHp,
  onClearTempHp,
  onShortRest,
  onLongRest,
  onApplyCondition,
  onRemoveCondition,
}: CombatPanelProps) {
  const resolvedCurrentHp = currentHp ?? maxHp;
  const concentrationCondition = conditions.find(
    (condition) => condition.name === "concentration",
  );
  const combatRowCount = 5 + (spellSaveDc !== undefined ? 1 : 0);

  return (
    <Card style={{ gridArea: "combat" }}>
      <CardHeader title="Combat" count={combatRowCount} countTone="combat" />
      <div className="card-body">
        <div className="hp-visual">
          <ProgressBar
            current={resolvedCurrentHp}
            max={maxHp}
            variant="hp"
            label="Hit Points"
            showNumbers={false}
          />
          <div className="combat-item !px-0">
            <span className="combat-item-label">Hit Points</span>
            <span className="combat-item-value hp">
              {resolvedCurrentHp} / {maxHp}
            </span>
          </div>
          {tempHp > 0 && <p className="mt-1 text-[11px] font-medium text-sky">Temporary HP: +{tempHp}</p>}
        </div>

        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center gap-2 rounded-[var(--radius-tag)] bg-ember/10 px-2 py-1 text-xs font-medium text-ember"
              >
                <span className="capitalize">{condition.name}</span>
                {editable &&
                  onRemoveCondition &&
                  condition.name !== "concentration" && (
                  <button
                    type="button"
                    onClick={() => {
                      void onRemoveCondition(condition.id);
                    }}
                    aria-label={`Clear ${condition.name}`}
                    className="text-[10px] font-semibold uppercase tracking-wide"
                  >
                    Clear
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <CombatRow label="Armor Class" value={String(armorClass)} detail={acBreakdown} />
          <CombatRow label="Initiative" value={formatModifier(initiative)} />
          <CombatRow label="Speed" value={`${speed} ft`} />
          <CombatRow label="Prof. Bonus" value={formatModifier(proficiencyBonus)} />
          {spellSaveDc !== undefined && (
            <CombatRow label="Spell Save DC" value={String(spellSaveDc)} />
          )}
        </div>

        {editable && (
          <div
            id="combat-actions"
            className="mx-4 mt-4 space-y-3 rounded-[var(--radius-card)] border border-border bg-paper-deep/80 p-3"
          >
            <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <label className="space-y-1 text-xs text-ink-soft">
                <span className="font-semibold text-ink">HP Amount</span>
                <input
                  name="amount"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  if (!onApplyDamage) return;
                  const amount = readPositiveNumber(event.currentTarget.form, "amount");
                  if (amount === null) return;
                  void onApplyDamage(amount);
                }}
              >
                Damage
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  if (!onHeal) return;
                  const amount = readPositiveNumber(event.currentTarget.form, "amount");
                  if (amount === null) return;
                  void onHeal(amount);
                }}
              >
                Heal
              </Button>
            </form>

            <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <label className="space-y-1 text-xs text-ink-soft">
                <span className="font-semibold text-ink">Temp HP</span>
                <input
                  name="tempAmount"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  if (!onGainTempHp) return;
                  const amount = readPositiveNumber(
                    event.currentTarget.form,
                    "tempAmount",
                  );
                  if (amount === null) return;
                  void onGainTempHp(amount);
                }}
              >
                Gain Temp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!onClearTempHp) return;
                  void onClearTempHp();
                }}
              >
                Clear Temp
              </Button>
            </form>

            <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <label className="space-y-1 text-xs text-ink-soft">
                <span className="font-semibold text-ink">Condition</span>
                <select
                  name="conditionName"
                  defaultValue="charmed"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                >
                  <option value="charmed">Charmed</option>
                  <option value="incapacitated">Incapacitated</option>
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  if (!onApplyCondition) return;
                  const nextCondition = readConditionName(event.currentTarget.form);
                  if (!nextCondition) return;
                  void onApplyCondition(nextCondition);
                }}
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!onShortRest) return;
                  void onShortRest();
                }}
              >
                Short Rest
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!onLongRest) return;
                  void onLongRest();
                }}
              >
                Long Rest
              </Button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (concentrationCondition) {
                    if (!onRemoveCondition) return;
                    void onRemoveCondition(concentrationCondition.id);
                    return;
                  }
                  if (!onApplyCondition) return;
                  void onApplyCondition("concentration");
                }}
              >
                {concentrationCondition ? "End Concentration" : "Start Concentration"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CombatRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="combat-item">
      <div className="min-w-0">
        <div className="combat-item-label">{label}</div>
        {detail && (
          <div className="mt-0.5 text-[11px] text-ink-soft/70">{detail}</div>
        )}
      </div>
      <div className="combat-item-value">{value}</div>
    </div>
  );
}
