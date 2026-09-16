import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  /** Removes the inner padding, for panes that manage their own. */
  flush?: boolean;
}

export function Card({ title, description, aside, children, flush }: CardProps) {
  return (
    <section className="card" data-flush={flush || undefined}>
      {title ? (
        <header className="card__head">
          <div>
            <h2 className="card__title">{title}</h2>
            {description ? <p className="card__description">{description}</p> : null}
          </div>
          {aside}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  );
}
