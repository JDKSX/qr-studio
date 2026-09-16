import { useEffect, useId, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { normaliseHex, safeColor } from "../../core/color";
import { useT } from "../../hooks/useT";
import { Field } from "./Field";
import { Tooltip } from "./Tooltip";

/* ------------------------------- Button ------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

export function Button({ variant = "secondary", size = "md", icon, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className="btn" data-variant={variant} data-size={size} {...rest}>
      {icon ? <span className="btn__icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}

/* ------------------------------- Slider ------------------------------- */

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  tooltip?: string;
  help?: string;
  /** Rendered next to the label, e.g. "22%". */
  format?: (value: number) => string;
  onChange(value: number): void;
}

export function Slider({ label, value, min, max, step = 1, tooltip, help, format, onChange }: SliderProps) {
  const id = useId();
  return (
    <Field
      label={label}
      htmlFor={id}
      tooltip={tooltip}
      help={help}
      wide
      aside={<output htmlFor={id}>{format ? format(value) : value}</output>}
    >
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

/* ------------------------------- Switch ------------------------------- */

interface SwitchProps {
  label: string;
  checked: boolean;
  tooltip?: string;
  onChange(checked: boolean): void;
}

export function Switch({ label, checked, tooltip, onChange }: SwitchProps) {
  const id = useId();
  return (
    <div className="switch-row">
      <label className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
        <span className="switch__label">{label}</span>
      </label>
      {tooltip ? <Tooltip label={label} text={tooltip} /> : null}
    </div>
  );
}

/* ---------------------------- Segmented control ---------------------------- */

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; title?: string }>;
  onChange(value: T): void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.title}
          className="segmented__item"
          data-active={value === option.value || undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Colour field ------------------------------ */

interface ColorFieldProps {
  label: string;
  value: string;
  tooltip?: string;
  onChange(value: string): void;
}

/**
 * A native colour picker paired with a hex input.
 * The text field is the accessible path — it accepts `#abc`, `abcdef` and
 * anything else the normaliser understands, and only commits valid values.
 */
export function ColorField({ label, value, tooltip, onChange }: ColorFieldProps) {
  const t = useT();
  const id = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    const normalised = normaliseHex(next);
    if (normalised) onChange(normalised);
    else setDraft(value);
  };

  return (
    <Field label={label} htmlFor={id} tooltip={tooltip}>
      <div className="color-field">
        <input
          className="color-field__swatch"
          type="color"
          value={safeColor(value).slice(0, 7)}
          aria-label={t("colors.pickerOf", { label })}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          id={id}
          className="color-field__hex"
          type="text"
          inputMode="text"
          spellCheck={false}
          value={draft}
          aria-label={t("colors.hexOf", { label })}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit((event.target as HTMLInputElement).value);
          }}
        />
      </div>
    </Field>
  );
}
