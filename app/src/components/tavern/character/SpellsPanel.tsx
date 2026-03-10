import { EmptyState } from "../ui/EmptyState.tsx";

export interface SpellDisplayProps {
  name: string;
  school: string;
  castingTime: string;
  concentration: boolean;
  ritual: boolean;
  alwaysPrepared: boolean;
}

export interface SlotPoolDisplayProps {
  level: number;
  total: number;
  current: number;
}

export interface SpellGroupDisplayProps {
  level: number;
  label: string;
  spells: SpellDisplayProps[];
  slots: SlotPoolDisplayProps | null;
}

export interface SpellsPanelProps {
  castingAbility: string | null;
  spellSaveDC: number | null;
  spellAttackBonus: number | null;
  groups: SpellGroupDisplayProps[];
}

function SlotDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${current} of ${total} spell slots available`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-full border border-wood/40 ${
            i < current
              ? "bg-ember"
              : "bg-cream-warm"
          }`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs text-ink-soft">
        {current}/{total}
      </span>
    </div>
  );
}

function SpellRow({ spell }: { spell: SpellDisplayProps }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border-light/60 px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-ink">{spell.name}</span>
        {spell.alwaysPrepared && (
          <span className="ml-1.5 inline-block rounded-[var(--radius-tag)] bg-forest/10 px-1.5 py-0.5 text-[10px] font-medium text-forest">
            Always
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[11px] text-ink-soft">
        <span>{spell.school}</span>
        <span className="text-border">|</span>
        <span>{spell.castingTime}</span>
        {spell.concentration && (
          <>
            <span className="text-border">|</span>
            <span className="font-medium text-ember" title="Concentration">C</span>
          </>
        )}
        {spell.ritual && (
          <>
            <span className="text-border">|</span>
            <span className="font-medium text-sky" title="Ritual">R</span>
          </>
        )}
      </div>
    </div>
  );
}

function SpellGroup({ group }: { group: SpellGroupDisplayProps }) {
  return (
    <div className="tavern-card overflow-hidden">
      <div className="flex items-center justify-between bg-cream-warm/50 px-3 py-2">
        <h4 className="font-heading text-sm font-bold text-ink">{group.label}</h4>
        {group.slots && (
          <SlotDots total={group.slots.total} current={group.slots.current} />
        )}
      </div>
      <div>
        {group.spells.map((spell) => (
          <SpellRow key={spell.name} spell={spell} />
        ))}
        {group.spells.length === 0 && (
          <div className="px-3 py-3 text-center text-xs text-ink-soft">
            No spells at this level
          </div>
        )}
      </div>
    </div>
  );
}

export function SpellsPanel({
  castingAbility,
  spellSaveDC,
  spellAttackBonus,
  groups,
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
      {/* Casting stats header */}
      <div className="tavern-card">
        <div className="flex items-center justify-around px-4 py-3">
          <div className="text-center">
            <div className="text-xs text-ink-soft">Casting Ability</div>
            <div className="font-heading text-sm font-bold text-ink">
              {castingAbility}
            </div>
          </div>
          <div className="h-6 w-px bg-border-light" />
          <div className="text-center">
            <div className="text-xs text-ink-soft">Spell Save DC</div>
            <div className="font-heading text-lg font-bold text-ink">
              {spellSaveDC ?? "--"}
            </div>
          </div>
          <div className="h-6 w-px bg-border-light" />
          <div className="text-center">
            <div className="text-xs text-ink-soft">Spell Attack</div>
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

      {/* Spell groups */}
      {groups.map((group) => (
        <SpellGroup key={group.level} group={group} />
      ))}

      {groups.length === 0 && (
        <div className="text-center text-sm text-ink-soft">
          No spells available
        </div>
      )}
    </div>
  );
}
