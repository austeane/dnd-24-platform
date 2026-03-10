import { Button } from "../ui/Button.tsx";
import { Card } from "../ui/Card.tsx";
import { StatBadge } from "../ui/StatBadge.tsx";

export interface CharacterCardProps {
  name: string;
  subtitle: string;
  level: number;
  className: string;
  species: string;
}

export function CharacterCard({
  name,
  subtitle,
  level,
  className: charClassName,
  species,
}: CharacterCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar placeholder */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-parchment font-heading text-2xl font-bold text-wood">
            {name.charAt(0)}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">
              {name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatBadge label={`Level ${level}`} variant="ember" />
              <StatBadge label={charClassName} variant="forest" />
              <StatBadge label={species} variant="sky" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <Button
            variant="warm"
            aria-disabled="true"
            tabIndex={-1}
            onClick={undefined}
          >
            Level Up
          </Button>
          <Button
            variant="outline"
            aria-disabled="true"
            tabIndex={-1}
            onClick={undefined}
          >
            Long Rest
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-soft/60">
        Level Up and Long Rest are not yet available in this version.
      </p>
    </Card>
  );
}
