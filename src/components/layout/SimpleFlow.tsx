import type { ReactNode } from "react";
import { getSchema } from "../../core/encode/contentSchemas";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { ContentForm, ContentTypeChips, PrivacyNote } from "../content/ContentFields";
import { QuickLogo } from "../logo/QuickLogo";
import { PresetPicker } from "../presets/PresetPicker";

function Step({
  index,
  title,
  note,
  children,
}: {
  index: number;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="step">
      <header className="step__head">
        <span className="step__number" aria-hidden="true">
          {index}
        </span>
        <h2 className="step__title">{title}</h2>
        {note ? <span className="step__note">{note}</span> : null}
      </header>
      <div className="step__body">{children}</div>
    </section>
  );
}

/**
 * The default view: three short steps, no tabs, no settings that most people
 * will never touch. Everything else is still there behind "customise it
 * yourself" — this just stops it from being the first thing you see.
 */
export function SimpleFlow() {
  const t = useT();
  const contentType = useStudio((state) => state.contentType);
  const setMode = useStudio((state) => state.setMode);

  return (
    <div className="simple-flow">
      <Step index={1} title={t("simple.stepContent")} note={t(getSchema(contentType).hintKey)}>
        <ContentTypeChips limited />
        <ContentForm />
      </Step>

      <Step index={2} title={t("simple.stepStyle")}>
        <PresetPicker />
      </Step>

      <Step index={3} title={t("simple.stepLogo")} note={t("simple.optional")}>
        <QuickLogo />
      </Step>

      <button type="button" className="advanced-cta" onClick={() => setMode("advanced")}>
        <span className="advanced-cta__text">
          <span className="advanced-cta__title">{t("simple.advancedCta")}</span>
          <span className="advanced-cta__hint">{t("simple.advancedHint")}</span>
        </span>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M6 3.5 10.5 8 6 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <PrivacyNote />
    </div>
  );
}
