import { useState } from "react";
import { ContentPanel } from "./components/content/ContentPanel";
import { ColorsPanel } from "./components/design/ColorsPanel";
import { DesignPanel } from "./components/design/DesignPanel";
import { ExportPanel } from "./components/export/ExportPanel";
import { MobileDownloadBar } from "./components/export/QuickDownload";
import { Header } from "./components/layout/Header";
import { PreviewPane } from "./components/layout/PreviewPane";
import { SimpleFlow } from "./components/layout/SimpleFlow";
import { Toast } from "./components/layout/Toast";
import { LogoPanel } from "./components/logo/LogoPanel";
import { PresetsPanel } from "./components/presets/PresetsPanel";
import { useQrPipeline } from "./hooks/useQrPipeline";
import type { QrPipeline } from "./hooks/useQrPipeline";
import { useT } from "./hooks/useT";
import { useDocumentLang, useTheme } from "./hooks/useTheme";
import type { TranslationKey } from "./i18n";
import { useStudio } from "./state/store";

const SECTIONS = [
  { id: "content", labelKey: "tab.content" },
  { id: "design", labelKey: "tab.design" },
  { id: "colors", labelKey: "tab.colors" },
  { id: "logo", labelKey: "tab.logo" },
  { id: "presets", labelKey: "tab.presets" },
  { id: "export", labelKey: "tab.export" },
] as const satisfies ReadonlyArray<{ id: string; labelKey: TranslationKey }>;

type SectionId = (typeof SECTIONS)[number]["id"];

function AdvancedPanels({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const setMode = useStudio((state) => state.setMode);
  const [section, setSection] = useState<SectionId>("design");

  return (
    <>
      <button type="button" className="back-to-simple" onClick={() => setMode("simple")}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M10 3.5 5.5 8l4.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t("simple.backToSimple")}
      </button>

      <div className="tabs" role="tablist" aria-label={t("app.sections")}>
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={section === item.id}
            aria-controls={`panel-${item.id}`}
            className="tabs__tab"
            data-active={section === item.id || undefined}
            onClick={() => setSection(item.id)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div
        className="app-panels"
        role="tabpanel"
        id={`panel-${section}`}
        aria-labelledby={`tab-${section}`}
        tabIndex={-1}
      >
        {section === "content" ? <ContentPanel /> : null}
        {section === "design" ? <DesignPanel /> : null}
        {section === "colors" ? <ColorsPanel /> : null}
        {section === "logo" ? <LogoPanel /> : null}
        {section === "presets" ? <PresetsPanel /> : null}
        {section === "export" ? <ExportPanel pipeline={pipeline} /> : null}
      </div>
    </>
  );
}

export default function App() {
  useTheme();
  useDocumentLang();
  const t = useT();
  const pipeline = useQrPipeline();
  const mode = useStudio((state) => state.mode);

  return (
    <div className="app">
      <a className="skip-link" href="#controls">
        {t("app.skipToControls")}
      </a>
      <Header />

      <main className="app-main">
        <section className="app-preview" aria-label={t("app.previewRegion")}>
          <PreviewPane pipeline={pipeline} />
        </section>

        <div className="app-controls" id="controls">
          {mode === "simple" ? <SimpleFlow /> : <AdvancedPanels pipeline={pipeline} />}
        </div>
      </main>

      <footer className="app-footer">
        <p>{t("app.footer")}</p>
      </footer>

      <MobileDownloadBar pipeline={pipeline} />
      <Toast />
    </div>
  );
}
