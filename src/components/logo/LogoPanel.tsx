import { useRef, useState } from "react";
import { ACCEPTED_LOGO_TYPES, loadLogoFile } from "../../core/logo/load";
import type { LoadLogoReason } from "../../core/logo/load";
import type { LogoPosition } from "../../core/render/types";
import { useT } from "../../hooks/useT";
import type { TranslationKey } from "../../i18n";
import { useStudio } from "../../state/store";
import { Card } from "../ui/Card";
import { Button, ColorField, Segmented, Slider, Switch } from "../ui/controls";
import { Field } from "../ui/Field";

const POSITIONS: ReadonlyArray<{ value: LogoPosition; labelKey: TranslationKey }> = [
  { value: "top-left", labelKey: "position.top-left" },
  { value: "top", labelKey: "position.top" },
  { value: "top-right", labelKey: "position.top-right" },
  { value: "left", labelKey: "position.left" },
  { value: "center", labelKey: "position.center" },
  { value: "right", labelKey: "position.right" },
  { value: "bottom-left", labelKey: "position.bottom-left" },
  { value: "bottom", labelKey: "position.bottom" },
  { value: "bottom-right", labelKey: "position.bottom-right" },
];

const LOAD_ERROR: Record<LoadLogoReason, TranslationKey> = {
  "too-big": "logo.tooBig",
  "bad-svg": "logo.badSvg",
  "bad-type": "logo.badType",
  "read-failed": "logo.readFailed",
};

export function LogoPanel() {
  const t = useT();
  const logo = useStudio((state) => state.design.logo);
  const setLogo = useStudio((state) => state.setLogo);
  const updateLogo = useStudio((state) => state.updateLogo);
  const notify = useStudio((state) => state.notify);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await loadLogoFile(file);
    setBusy(false);

    if (!result.ok) {
      setError(t(LOAD_ERROR[result.reason], { message: result.detail ?? "" }));
      return;
    }

    setLogo({
      src: result.logo.src,
      aspect: result.logo.aspect,
      size: logo?.size ?? 0.2,
      position: logo?.position ?? "center",
      padding: logo?.padding ?? 1,
      background: logo?.background ?? true,
      backgroundColor: logo?.backgroundColor ?? "#ffffff",
      cornerRadius: logo?.cornerRadius ?? 0.35,
    });
    notify(t("logo.added"), "success");
  };

  return (
    <Card title={t("logo.title")} description={t("logo.description")}>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        accept={ACCEPTED_LOGO_TYPES}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="logo-drop">
        {logo ? (
          <img className="logo-drop__preview" src={logo.src} alt={t("logo.preview")} />
        ) : (
          <div className="logo-drop__empty" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path
                d="M4 16.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5Zm0 0 4.5-4.5 3 3L15 11l5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="8.5" r="1.4" fill="currentColor" />
            </svg>
          </div>
        )}
        <div className="logo-drop__actions">
          <Button variant="primary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? t("logo.reading") : logo ? t("logo.replace") : t("logo.add")}
          </Button>
          {logo ? (
            <Button variant="ghost" size="sm" onClick={() => setLogo(null)}>
              {t("common.remove")}
            </Button>
          ) : null}
          <p className="logo-drop__hint">{t("logo.hint")}</p>
        </div>
      </div>

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      {logo ? (
        <>
          <Slider
            label={t("logo.size")}
            value={Math.round(logo.size * 100)}
            min={8}
            max={34}
            tooltip={t("logo.size.tip")}
            format={(value) => t("common.percent", { n: value })}
            onChange={(value) => updateLogo({ size: value / 100 })}
          />
          <Slider
            label={t("logo.padding")}
            value={logo.padding}
            min={0}
            max={4}
            step={0.5}
            format={(value) => t("common.modules", { n: value })}
            onChange={(value) => updateLogo({ padding: value })}
          />
          <Field label={t("logo.position")} wide>
            <div className="position-grid" role="radiogroup" aria-label={t("logo.position")}>
              {POSITIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={logo.position === option.value}
                  aria-label={t(option.labelKey)}
                  title={t(option.labelKey)}
                  className="position-cell"
                  data-active={logo.position === option.value || undefined}
                  onClick={() => updateLogo({ position: option.value })}
                />
              ))}
            </div>
          </Field>
          <Switch
            label={t("logo.plate")}
            checked={logo.background}
            tooltip={t("logo.plate.tip")}
            onChange={(background) => updateLogo({ background })}
          />
          {logo.background ? (
            <>
              <ColorField
                label={t("logo.plateColor")}
                value={logo.backgroundColor}
                onChange={(backgroundColor) => updateLogo({ backgroundColor })}
              />
              <Slider
                label={t("logo.plateRadius")}
                value={Math.round(logo.cornerRadius * 100)}
                min={0}
                max={100}
                format={(value) => t("common.percent", { n: value })}
                onChange={(value) => updateLogo({ cornerRadius: value / 100 })}
              />
            </>
          ) : null}
          <Segmented
            label={t("logo.quickSize")}
            value={logo.size <= 0.15 ? "small" : logo.size <= 0.22 ? "medium" : "large"}
            options={[
              { value: "small", label: t("logo.small") },
              { value: "medium", label: t("logo.medium") },
              { value: "large", label: t("logo.large") },
            ]}
            onChange={(value) =>
              updateLogo({ size: value === "small" ? 0.14 : value === "medium" ? 0.2 : 0.28 })
            }
          />
        </>
      ) : null}
    </Card>
  );
}
