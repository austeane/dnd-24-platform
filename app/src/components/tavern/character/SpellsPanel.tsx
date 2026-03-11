import { Button } from "../ui/Button.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";

export interface SpellDisplayProps {
  name: string;
  school: string;
  castingTime: string;
  concentration: boolean;
  ritual: boolean;
  alwaysPrepared: boolean;
  freeCast: {
    resourceName: string;
    current: number;
    max: number;
  } | null;
}

export interface SlotPoolDisplayProps {
  resourceName: string;
  kind: "standard" | "pact";
  level: number;
  total: number;
  current: number;
}

export interface SpellGroupDisplayProps {
  level: number;
  label: string;
  spells: SpellDisplayProps[];
  slots: SlotPoolDisplayProps[];
}

export interface SpellsPanelProps {
  castingAbility: string | null;
  spellSaveDC: number | null;
  spellAttackBonus: number | null;
  groups: SpellGroupDisplayProps[];
  editable?: boolean;
  onSpendSlot?: (slot: SlotPoolDisplayProps) => Promise<void>;
  onSpendFreeCast?: (spellName: string) => Promise<void>;
}

function SlotDots({ total, current }: { total: number; current: number }) {
  const dotNumbers = Array.from({ length: total }, (_, dotNumber) => dotNumber + 1);

  return (
    <div className="slot-row" role="group" aria-label={`${current} of ${total} spell slots available`}>
      {dotNumbers.map((dotNumber) => (
        <span
          key={dotNumber}
          className={`slot-circle ${dotNumber <= current ? "filled" : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs text-ink-soft">
        {current}/{total}
      </span>
    </div>
  );
}

function SpellRow({
  spell,
  editable,
  onSpendFreeCast,
}: {
  spell: SpellDisplayProps;
  editable: boolean;
  onSpendFreeCast?: (spellName: string) => Promise<void>;
}) {
  return (
    <div className="spell-item">
      <div className="min-w-0 flex-1">
        <div className="spell-item-name">{spell.name}</div>
        <div className="spell-item-meta">
          <span>{spell.school}</span>
          <span>&middot;</span>
          <span>{spell.castingTime}</span>
        </div>
      </div>
      <div className="spell-item-tags">
        {spell.alwaysPrepared && (
          <span className="spell-tag spell-tag-forest">
            Always
          </span>
        )}
        {spell.freeCast && (
          <span className="spell-tag spell-tag-sky">
            Free Cast {spell.freeCast.current}/{spell.freeCast.max}
          </span>
        )}
        {spell.concentration && (
          <span className="spell-tag spell-tag-ember" title="Concentration">Concentration</span>
        )}
        {spell.ritual && (
          <span className="spell-tag spell-tag-brass" title="Ritual">Ritual</span>
        )}
        {editable && spell.freeCast && spell.freeCast.current > 0 && onSpendFreeCast && (
          <Button
            type="button"
            variant="outline"
            className="px-2 py-1 text-[10px]"
            onClick={() => {
              void onSpendFreeCast(spell.name);
            }}
          >
            Spend Free Cast
          </Button>
        )}
      </div>
    </div>
  );
}

function SpellGroup({
  group,
  editable,
  onSpendSlot,
  onSpendFreeCast,
}: {
  group: SpellGroupDisplayProps;
  editable: boolean;
  onSpendSlot?: (slot: SlotPoolDisplayProps) => Promise<void>;
  onSpendFreeCast?: (spellName: string) => Promise<void>;
}) {
  return (
    <section className="spell-group">
      <div className="spell-group-header">
        <h4 className="spell-group-name">{group.label}</h4>
        <div className="flex flex-col items-end gap-2">
          {group.slots.map((slot) => (
            <div key={slot.resourceName} className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-wood">
                {slot.kind === "pact" ? "Pact" : "Slots"}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <SlotDots total={slot.total} current={slot.current} />
                {editable && slot.current > 0 && onSpendSlot && (
                  <Button
                    type="button"
                    variant="outline"
                    className="px-2 py-1 text-[10px]"
                    onClick={() => {
                      void onSpendSlot(slot);
                    }}
                  >
                    Spend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="spell-pills">
        {group.spells.map((spell) => (
          <SpellRow
            key={spell.name}
            spell={spell}
            editable={editable}
            onSpendFreeCast={onSpendFreeCast}
          />
        ))}
        {group.spells.length === 0 && (
          <div className="px-3 py-3 text-center text-xs text-ink-soft">
            No spells at this level
          </div>
        )}
      </div>
    </section>
  );
}

export function SpellsPanel({
  castingAbility,
  spellSaveDC,
  spellAttackBonus,
  groups,
  editable = false,
  onSpendSlot,
  onSpendFreeCast,
}: SpellsPanelProps) {
  if (!castingAbility) {
    return (
      <EmptyState
        title="No Spellcasting"
        description="This character does not have spellcasting abilities."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="spellbook-stats-card">
        <div className="spellbook-stats-grid">
          <div className="text-center">
            <div className="spellbook-stat-label">Casting Ability</div>
            <div className="font-heading text-sm font-bold text-ink">
              {castingAbility}
            </div>
          </div>
          <div className="spellbook-divider" />
          <div className="text-center">
            <div className="spellbook-stat-label">Spell Save DC</div>
            <div className="font-heading text-lg font-bold text-ink">
              {spellSaveDC ?? "--"}
            </div>
          </div>
          <div className="spellbook-divider" />
          <div className="text-center">
            <div className="spellbook-stat-label">Spell Attack</div>
            <div className="font-heading text-lg font-bold text-ink">
              {spellAttackBonus !== null
                ? spellAttackBonus >= 0
                  ? `+${spellAttackBonus}`
                  : `${spellAttackBonus}`
                : "--"}
            </div>
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <SpellGroup
          key={group.level}
          group={group}
          editable={editable}
          onSpendSlot={onSpendSlot}
          onSpendFreeCast={onSpendFreeCast}
        />
      ))}

      {groups.length === 0 && (
        <div className="text-center text-sm text-ink-soft">
          No spells available
        </div>
      )}
    </div>
  );
}
