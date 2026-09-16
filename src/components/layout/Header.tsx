import { useT } from "../../hooks/useT";
import type { Lang } from "../../i18n";
import { LANGUAGES } from "../../i18n";
import { useStudio } from "../../state/store";
import type { ThemeChoice } from "../../state/store";
import { Button, Segmented } from "../ui/controls";

const DEMO_URL = "https://github.com/";

export function Header() {
  const t = useT();
  const theme = useStudio((state) => state.theme);
  const setTheme = useStudio((state) => state.setTheme);
  const lang = useStudio((state) => state.lang);
  const setLang = useStudio((state) => state.setLang);
  const setContentType = useStudio((state) => state.setContentType);
  const setField = useStudio((state) => state.setField);
  const applyPreset = useStudio((state) => state.applyPreset);
  const setLogo = useStudio((state) => state.setLogo);
  const notify = useStudio((state) => state.notify);

  const tryDemo = () => {
    setContentType("url");
    setField("url", DEMO_URL);
    applyPreset("gradient");
    setLogo(null);
    notify(t("header.demoLoaded"), "info");
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <g fill="var(--surface)">
              <rect x="6" y="6" width="8" height="8" rx="2.2" />
              <rect x="18" y="6" width="8" height="8" rx="2.2" />
              <rect x="6" y="18" width="8" height="8" rx="2.2" />
              <rect x="18" y="18" width="3.2" height="3.2" rx="1" />
              <rect x="22.8" y="18" width="3.2" height="3.2" rx="1" />
              <rect x="18" y="22.8" width="3.2" height="3.2" rx="1" />
              <rect x="22.8" y="22.8" width="3.2" height="3.2" rx="1" />
            </g>
          </svg>
        </span>
        <div>
          <h1 className="app-header__title">JDKS QR Studio</h1>
          <p className="app-header__tagline">{t("app.tagline")}</p>
        </div>
      </div>

      <div className="app-header__actions">
        <Button size="sm" variant="ghost" onClick={tryDemo}>
          {t("header.tryDemo")}
        </Button>
        <Segmented
          label={t("header.language")}
          value={lang}
          options={LANGUAGES.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(value) => setLang(value as Lang)}
        />
        <Segmented
          label={t("header.theme")}
          value={theme}
          options={[
            { value: "light", label: t("header.themeLight") },
            { value: "dark", label: t("header.themeDark") },
            { value: "system", label: t("header.themeAuto") },
          ]}
          onChange={(value) => setTheme(value as ThemeChoice)}
        />
      </div>
    </header>
  );
}
