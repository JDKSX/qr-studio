import { useId, useState } from "react";
import type { ReactNode } from "react";

interface AccordionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * Native disclosure semantics built by hand so the open state can be animated
 * and the header can carry a badge — `<details>` fights both of those.
 */
export function Accordion({ title, description, defaultOpen = false, badge, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="accordion" data-open={open || undefined}>
      <h3 className="accordion__heading">
        <button
          type="button"
          id={buttonId}
          className="accordion__trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="accordion__title">
            {title}
            {description ? <span className="accordion__description">{description}</span> : null}
          </span>
          {badge}
          <svg className="accordion__chevron" viewBox="0 0 16 16" aria-hidden="true" width="16" height="16">
            <path
              d="M4 6.5 8 10.5 12 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} className="accordion__panel" hidden={!open}>
        <div className="accordion__content">{children}</div>
      </div>
    </div>
  );
}
