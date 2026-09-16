import { useState } from "react";
import { CONTENT_SCHEMAS } from "../../core/encode/contentSchemas";
import { DESIGN_PRESETS } from "../../core/presets/design";
import { useT } from "../../hooks/useT";
import type { Translate } from "../../i18n";
import { useStudio } from "../../state/store";
import { Accordion } from "../ui/Accordion";
import { Card } from "../ui/Card";
import { Button } from "../ui/controls";

function relativeTime(timestamp: number, t: Translate): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t("common.justNow");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t("common.minutesAgo", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("common.hoursAgo", { n: hours });
  return t("common.daysAgo", { n: Math.round(hours / 24) });
}

function SavedDesigns() {
  const t = useT();
  const savedDesigns = useStudio((state) => state.savedDesigns);
  const saveCurrentDesign = useStudio((state) => state.saveCurrentDesign);
  const applySavedDesign = useStudio((state) => state.applySavedDesign);
  const deleteSavedDesign = useStudio((state) => state.deleteSavedDesign);
  const notify = useStudio((state) => state.notify);
  const [name, setName] = useState("");

  return (
    <>
      <form
        className="save-row"
        onSubmit={(event) => {
          event.preventDefault();
          const finalName = name.trim() || t("presets.untitled");
          saveCurrentDesign(name, t("presets.untitled"));
          notify(t("presets.savedToast", { name: finalName }), "success");
          setName("");
        }}
      >
        <label className="visually-hidden" htmlFor="save-design-name">
          {t("presets.nameField")}
        </label>
        <input
          id="save-design-name"
          className="input"
          type="text"
          maxLength={40}
          placeholder={t("presets.namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" variant="primary" size="sm">
          {t("presets.save")}
        </Button>
      </form>

      {savedDesigns.length === 0 ? (
        <p className="empty-note">{t("presets.savedEmpty")}</p>
      ) : (
        <ul className="record-list">
          {savedDesigns.map((entry) => (
            <li key={entry.id} className="record">
              <button type="button" className="record__main" onClick={() => applySavedDesign(entry.id)}>
                <span className="record__name">{entry.name}</span>
                <span className="record__meta">{relativeTime(entry.createdAt, t)}</span>
              </button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("presets.deleteNamed", { name: entry.name })}
                onClick={() => deleteSavedDesign(entry.id)}
              >
                {t("common.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function RecentCodes() {
  const t = useT();
  const history = useStudio((state) => state.history);
  const applyHistoryEntry = useStudio((state) => state.applyHistoryEntry);
  const clearHistory = useStudio((state) => state.clearHistory);

  if (history.length === 0) {
    return <p className="empty-note">{t("presets.recentEmpty")}</p>;
  }

  return (
    <>
      <ul className="record-list">
        {history.map((entry) => (
          <li key={entry.id} className="record">
            <button type="button" className="record__main" onClick={() => applyHistoryEntry(entry.id)}>
              <span className="record__name">{entry.label}</span>
              <span className="record__meta">
                {t(CONTENT_SCHEMAS[entry.contentType].labelKey)} · {relativeTime(entry.createdAt, t)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" onClick={clearHistory}>
        {t("presets.clearHistory")}
      </Button>
    </>
  );
}

export function PresetsPanel() {
  const t = useT();
  const applyPreset = useStudio((state) => state.applyPreset);

  return (
    <Card title={t("presets.title")} description={t("presets.description")}>
      <div className="preset-grid">
        {DESIGN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-tile"
            onClick={() => applyPreset(preset.id)}
            title={t(preset.descriptionKey)}
          >
            <span
              className="preset-tile__swatch"
              aria-hidden="true"
              style={{
                background:
                  preset.design.background.paint.mode === "gradient"
                    ? `linear-gradient(135deg, ${preset.design.background.paint.gradient.from}, ${preset.design.background.paint.gradient.to})`
                    : preset.design.background.paint.color,
              }}
            >
              <span
                style={{
                  background:
                    preset.design.dots.paint.mode === "gradient"
                      ? `linear-gradient(135deg, ${preset.design.dots.paint.gradient.from}, ${preset.design.dots.paint.gradient.to})`
                      : preset.design.dots.paint.color,
                  borderRadius:
                    preset.design.dots.shape === "circle" || preset.design.dots.shape === "dot"
                      ? "50%"
                      : preset.design.dots.shape === "square"
                        ? "2px"
                        : "30%",
                }}
              />
            </span>
            <span className="preset-tile__name">{t(preset.nameKey)}</span>
          </button>
        ))}
      </div>

      <Accordion title={t("presets.saved")} description={t("presets.saved.description")}>
        <SavedDesigns />
      </Accordion>
      <Accordion title={t("presets.recent")} description={t("presets.recent.description")}>
        <RecentCodes />
      </Accordion>
    </Card>
  );
}
