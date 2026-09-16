import { useId, useState } from "react";
import { useT } from "../../hooks/useT";

interface TooltipProps {
  /** The explanation shown to sighted users and announced to screen readers. */
  text: string;
  /** What the tooltip is about, used for the trigger's accessible name. */
  label: string;
}

/**
 * A hint attached to a setting. The trigger is a real button so it is reachable
 * by keyboard, and the bubble is linked with `aria-describedby` rather than
 * relying on hover alone.
 */
export function Tooltip({ text, label }: TooltipProps) {
  const t = useT();
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="tooltip">
      <button
        type="button"
        className="tooltip__trigger"
        aria-label={t("common.aboutSetting", { label })}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 7.2v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
        </svg>
      </button>
      <span role="tooltip" id={id} className="tooltip__bubble" data-open={open || undefined}>
        {text}
      </span>
    </span>
  );
}
