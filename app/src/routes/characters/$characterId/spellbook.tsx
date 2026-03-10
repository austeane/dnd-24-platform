import { createFileRoute } from "@tanstack/react-router";
import { SpellsPanel } from "../../../components/tavern/character/SpellsPanel.tsx";
import type { SpellsPanelProps } from "../../../components/tavern/character/SpellsPanel.tsx";
import { fetchSpellbookData, type SpellbookData } from "./-server.ts";

function toSpellsPanelProps(data: SpellbookData): SpellsPanelProps {
  return {
    castingAbility: data.castingAbility,
    spellSaveDC: data.spellSaveDC,
    spellAttackBonus: data.spellAttackBonus,
    groups: data.groups.map((group) => ({
      level: group.level,
      label: group.label,
      spells: group.spells.map((spell) => ({
        name: spell.name,
        school: spell.school,
        castingTime: spell.castingTime,
        concentration: spell.concentration,
        ritual: spell.ritual,
        alwaysPrepared: spell.alwaysPrepared,
      })),
      slots: group.slots
        ? {
            level: group.slots.level,
            total: group.slots.total,
            current: group.slots.current,
          }
        : null,
    })),
  };
}

export const Route = createFileRoute(
  "/characters/$characterId/spellbook",
)({
  loader: async ({ params }) => {
    const data = await fetchSpellbookData({
      data: { characterId: params.characterId },
    });
    return { spellbook: data };
  },
  component: SpellbookRoute,
});

function SpellbookRoute() {
  const { spellbook } = Route.useLoaderData();
  const props = toSpellsPanelProps(spellbook);

  return (
    <div className="animate-fade-up py-4">
      <SpellsPanel {...props} />
    </div>
  );
}
