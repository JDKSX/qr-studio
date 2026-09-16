import { useId, useState } from "react";
import {
  COMMON_CONTENT_TYPES,
  CONTENT_SCHEMAS,
  CONTENT_TYPE_ORDER,
  getSchema,
  visibleFields,
} from "../../core/encode/contentSchemas";
import type { FieldDef } from "../../core/encode/types";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { Field } from "../ui/Field";

/**
 * The content form, split out so both the simple flow and the advanced
 * Content tab render exactly the same inputs.
 */

function ContentField({ field }: { field: FieldDef }) {
  const id = useId();
  const t = useT();
  const value = useStudio((state) => state.values[state.contentType]?.[field.name] ?? "");
  const setField = useStudio((state) => state.setField);

  const label = t(field.labelKey);
  const help = field.helpKey ? t(field.helpKey) : undefined;
  const placeholder = field.placeholderKey ? t(field.placeholderKey) : field.placeholder;

  const shared = {
    id,
    name: field.name,
    className: "input",
    placeholder,
    maxLength: field.maxLength,
    autoComplete: field.autoComplete,
    required: field.required,
    "aria-required": field.required || undefined,
  } as const;

  if (field.kind === "checkbox") {
    return (
      <div className="field" data-wide>
        <label className="checkbox">
          <input
            id={id}
            type="checkbox"
            checked={value === "true"}
            onChange={(event) => setField(field.name, event.target.checked ? "true" : "")}
          />
          <span>{label}</span>
        </label>
        {help ? <p className="field__help">{help}</p> : null}
      </div>
    );
  }

  let control;
  if (field.kind === "textarea") {
    control = (
      <textarea {...shared} rows={3} value={value} onChange={(event) => setField(field.name, event.target.value)} />
    );
  } else if (field.kind === "select") {
    control = (
      <select {...shared} value={value} onChange={(event) => setField(field.name, event.target.value)}>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    );
  } else {
    const inputType =
      field.kind === "datetime" ? "datetime-local" : field.kind === "password" ? "password" : field.kind;
    control = (
      <input {...shared} type={inputType} value={value} onChange={(event) => setField(field.name, event.target.value)} />
    );
  }

  return (
    <Field label={label} htmlFor={id} help={help} wide={field.wide}>
      {control}
    </Field>
  );
}

/**
 * `limited` shows only the five most-used types plus a "more" chip.
 * The rest stay one click away — and appear on their own if one of them is
 * already selected, so nothing can end up hidden while in use.
 */
export function ContentTypeChips({ limited = false }: { limited?: boolean }) {
  const t = useT();
  const contentType = useStudio((state) => state.contentType);
  const setContentType = useStudio((state) => state.setContentType);
  const [requestedAll, setRequestedAll] = useState(false);

  const showAll = !limited || requestedAll || !COMMON_CONTENT_TYPES.includes(contentType);
  const visible = showAll ? CONTENT_TYPE_ORDER : COMMON_CONTENT_TYPES;

  return (
    <div className="type-grid" role="radiogroup" aria-label={t("content.typeGroup")}>
      {visible.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={contentType === id}
          className="type-chip"
          data-active={contentType === id || undefined}
          onClick={() => setContentType(id)}
        >
          {t(CONTENT_SCHEMAS[id].labelKey)}
        </button>
      ))}

      {showAll ? null : (
        <button type="button" className="type-chip type-chip--more" onClick={() => setRequestedAll(true)}>
          {t("content.more")}
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
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
      )}
    </div>
  );
}

export function ContentForm() {
  const contentType = useStudio((state) => state.contentType);
  const values = useStudio((state) => state.values[state.contentType] ?? {});
  const fields = visibleFields(getSchema(contentType), values);

  return (
    <div className="form-grid">
      {fields.map((field) => (
        <ContentField key={`${contentType}:${field.name}`} field={field} />
      ))}
    </div>
  );
}

export function PrivacyNote() {
  const t = useT();
  return (
    <p className="privacy-note">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M8 1.5 3 3.5v4c0 3 2.1 5.6 5 6.9 2.9-1.3 5-3.9 5-6.9v-4L8 1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="m5.8 7.8 1.6 1.7 3-3.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {t("content.privacy")}
    </p>
  );
}
