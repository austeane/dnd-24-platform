import {
  AbilityScoreCard,
  type AbilityScoreCardProps,
} from "./AbilityScoreCard.tsx";

export interface AbilityScoreRowProps {
  abilities: AbilityScoreCardProps[];
}

export function AbilityScoreRow({ abilities }: AbilityScoreRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {abilities.map((ability) => (
        <AbilityScoreCard key={ability.name} {...ability} />
      ))}
    </div>
  );
}
