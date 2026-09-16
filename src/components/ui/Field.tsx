import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  tooltip?: string;
  /** Rendered on the right of the label row, e.g. a live value. */
  aside?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}

/** Shared label + help + tooltip scaffolding for every control in the studio. */
export function Field({ label, htmlFor, help, tooltip, aside, wide, children }: FieldProps) {
  return (
    <div className="field" data-wide={wide || undefined}>
      <div className="field__head">
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {tooltip ? <Tooltip label={label} text={tooltip} /> : null}
        {aside ? <span className="field__aside">{aside}</span> : null}
      </div>
      {children}
      {help ? <p className="field__help">{help}</p> : null}
    </div>
  );
}
