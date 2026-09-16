import { useRef, useState } from "react";
import { ACCEPTED_LOGO_TYPES, loadLogoFile } from "../../core/logo/load";
import type { LoadLogoReason } from "../../core/logo/load";
import { useT } from "../../hooks/useT";
import type { TranslationKey } from "../../i18n";
import { useStudio } from "../../state/store";
import { Button, Slider } from "../ui/controls";

const LOAD_ERROR: Record<LoadLogoReason, TranslationKey> = {
  "too-big": "logo.tooBig",
  "bad-svg": "logo.badSvg",
  "bad-type": "logo.badType",
  "read-failed": "logo.readFailed",
};

/**
 * Logo step for the simple flow: add, resize, remove.
 * Position, plate colour and corner radius live in the advanced Logo tab —
 * sensible defaults cover the common case.
 */
export function QuickLogo() {
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
    <>
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

      <div className="quick-logo">
        {logo ? <img className="quick-logo__preview" src={logo.src} alt={t("logo.preview")} /> : null}
        <Button variant={logo ? "secondary" : "primary"} disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? t("logo.reading") : logo ? t("logo.replace") : t("logo.add")}
        </Button>
        {logo ? (
          <Button variant="ghost" onClick={() => setLogo(null)}>
            {t("common.remove")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      {logo ? (
        <Slider
          label={t("logo.size")}
          value={Math.round(logo.size * 100)}
          min={8}
          max={34}
          format={(value) => t("common.percent", { n: value })}
          onChange={(value) => updateLogo({ size: value / 100 })}
        />
      ) : (
        <p className="field__help">{t("logo.hint")}</p>
      )}
    </>
  );
}
