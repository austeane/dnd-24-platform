import { Link } from "@tanstack/react-router";
import { StatBadge } from "../ui/StatBadge.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../layout/accessibility.ts";

export interface CharacterCardProps {
  name: string;
  subtitle: string;
  level: number;
  className: string;
  species: string;
  levelUpHref?: string | null;
}

export function CharacterCard({
  name,
  subtitle,
  level,
  className: charClassName,
  species,
  levelUpHref = null,
}: CharacterCardProps) {
  return (
    <section className="char-card animate-fade-up">
      <div className="char-avatar" aria-hidden="true">
        <span>{name.charAt(0)}</span>
      </div>
      <div className="char-info">
        <h1
          className="char-heading font-heading text-2xl font-semibold text-ink sm:text-[2rem]"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          {name}
        </h1>
        <p>{subtitle}</p>
        <div className="char-meta">
          <StatBadge label={`Level ${level}`} variant="ember" />
          <StatBadge label={charClassName} variant="forest" />
          <StatBadge label={species} variant="sky" />
        </div>
      </div>

      {levelUpHref ? (
        <div className="char-actions">
          <Link
            to={levelUpHref as never}
            className="btn btn-warm inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Level Up
          </Link>
        </div>
      ) : null}
    </section>
  );
}
