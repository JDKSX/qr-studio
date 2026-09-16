import { COLOR_PALETTES } from "../../core/presets/design";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { Accordion } from "../ui/Accordion";
import { Card } from "../ui/Card";
import { Switch } from "../ui/controls";
import { Field } from "../ui/Field";
import { PaintEditor } from "./PaintEditor";

export function ColorsPanel() {
  const t = useT();
  const design = useStudio((state) => state.design);
  const setPaint = useStudio((state) => state.setPaint);
  const setBackgroundTransparent = useStudio((state) => state.setBackgroundTransparent);
  const applyPalette = useStudio((state) => state.applyPalette);

  return (
    <Card title={t("colors.title")} description={t("colors.description")}>
      <Field label={t("colors.palette")} wide help={t("colors.palette.help")}>
        <div className="palette-grid" role="radiogroup" aria-label={t("colors.paletteGroup")}>
          {COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={false}
              className="palette-chip"
              onClick={() => applyPalette(palette.id)}
              title={`${t(palette.nameKey)}: ${palette.foreground} / ${palette.background}`}
            >
              <span
                className="palette-chip__swatch"
                style={{ background: palette.background, borderColor: palette.foreground }}
                aria-hidden="true"
              >
                <span style={{ background: palette.foreground }} />
              </span>
              <span className="palette-chip__name">{t(palette.nameKey)}</span>
            </button>
          ))}
        </div>
      </Field>

      <PaintEditor
        label={t("colors.modules")}
        paint={design.dots.paint}
        tooltip={t("colors.modules.tip")}
        onChange={(paint) => setPaint("dots", paint)}
      />

      <Accordion title={t("colors.background")} defaultOpen>
        <Switch
          label={t("colors.transparent")}
          checked={design.background.transparent}
          tooltip={t("colors.transparent.tip")}
          onChange={setBackgroundTransparent}
        />
        <PaintEditor
          label={t("colors.background")}
          paint={design.background.paint}
          onChange={(paint) => setPaint("background", paint)}
        />
      </Accordion>

      <Accordion title={t("colors.finders")} description={t("colors.finders.description")}>
        <PaintEditor
          label={t("design.eyeOuter")}
          paint={design.eyes.outerPaint}
          inheritedFrom={design.dots.paint}
          onChange={(paint) => setPaint("eyeOuter", paint)}
        />
        <PaintEditor
          label={t("design.eyeInner")}
          paint={design.eyes.innerPaint}
          inheritedFrom={design.eyes.outerPaint ?? design.dots.paint}
          inheritLabel={t("colors.inheritOuter")}
          onChange={(paint) => setPaint("eyeInner", paint)}
        />
      </Accordion>
    </Card>
  );
}
