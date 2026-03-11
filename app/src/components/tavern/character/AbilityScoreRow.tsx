import {
  AbilityScoreCard,
  type AbilityScoreCardProps,
} from "./AbilityScoreCard.tsx";

export interface AbilityScoreRowProps {
  abilities: AbilityScoreCardProps[];
}

export function AbilityScoreRow({ abilities }: AbilityScoreRowProps) {
  return (
    <div className="abilities-row">
      {abilities.map((ability) => (
        <AbilityScoreCard key={ability.name} {...ability} />
      ))}
    </div>
  );
}
