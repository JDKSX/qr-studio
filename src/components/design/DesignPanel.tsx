import { ECC_LEVELS } from "../../core/encode/qrEngine";
import type { EccLevel } from "../../core/encode/qrEngine";
import { DOT_SHAPES } from "../../core/render/dots";
import { EYE_INNER_SHAPES, EYE_OUTER_SHAPES } from "../../core/render/eyes";
import { FRAMES } from "../../core/render/frames";
import { useT } from "../../hooks/useT";
import type { TranslationKey } from "../../i18n";
import { useStudio } from "../../state/store";
import { Accordion } from "../ui/Accordion";
import { Card } from "../ui/Card";
import { Button, Segmented, Slider } from "../ui/controls";
import { Field } from "../ui/Field";
import { DotThumb, EyeThumb } from "./ShapeThumb";

const QUIET_PRESETS: ReadonlyArray<{ value: number; labelKey: TranslationKey }> = [
  { value: 0, labelKey: "design.quiet.none" },
  { value: 2, labelKey: "design.quiet.minimum" },
  { value: 4, labelKey: "design.quiet.standard" },
  { value: 6, labelKey: "design.quiet.comfortable" },
];

const ECC_TITLE: Record<EccLevel, TranslationKey> = {
  L: "ecc.L.title",
  M: "ecc.M.title",
  Q: "ecc.Q.title",
  H: "ecc.H.title",
};

const ECC_DETAIL: Record<EccLevel, TranslationKey> = {
  L: "ecc.L.detail",
  M: "ecc.M.detail",
  Q: "ecc.Q.detail",
  H: "ecc.H.detail",
};

function DotShapePicker() {
  const t = useT();
  const shape = useStudio((state) => state.design.dots.shape);
  const setDotShape = useStudio((state) => state.setDotShape);

  return (
    <Field label={t("design.moduleShape")} tooltip={t("design.moduleShape.tip")} wide>
      <div className="shape-grid" role="radiogroup" aria-label={t("design.moduleShape")}>
        {DOT_SHAPES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={shape === option.id}
            className="shape-tile"
            data-active={shape === option.id || undefined}
            onClick={() => setDotShape(option.id)}
          >
            <DotThumb shape={option.id} />
            <span className="shape-tile__label">
              {t(option.labelKey)}
              {option.experimental ? <em className="shape-tile__flag">{t("design.beta")}</em> : null}
            </span>
          </button>
        ))}
      </div>
    </Field>
  );
}

function EyeShapePicker() {
  const t = useT();
  const outer = useStudio((state) => state.design.eyes.outer);
  const inner = useStudio((state) => state.design.eyes.inner);
  const setEyeShape = useStudio((state) => state.setEyeShape);

  return (
    <>
      <Field label={t("design.eyeOuter")} tooltip={t("design.eyeOuter.tip")} wide>
        <div className="shape-grid" role="radiogroup" aria-label={t("design.eyeOuter")}>
          {EYE_OUTER_SHAPES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={outer === option.id}
              className="shape-tile"
              data-active={outer === option.id || undefined}
              onClick={() => setEyeShape("outer", option.id)}
            >
              <EyeThumb outer={option.id} inner={inner} />
              <span className="shape-tile__label">{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("design.eyeInner")} wide>
        <div className="shape-grid" role="radiogroup" aria-label={t("design.eyeInner")}>
          {EYE_INNER_SHAPES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={inner === option.id}
              className="shape-tile"
              data-active={inner === option.id || undefined}
              onClick={() => setEyeShape("inner", option.id)}
            >
              <EyeThumb outer={outer} inner={option.id} />
              <span className="shape-tile__label">{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

function FrameControls() {
  const t = useT();
  const frame = useStudio((state) => state.design.frame);
  const setFrame = useStudio((state) => state.setFrame);

  return (
    <>
      <Field label={t("design.frame")} tooltip={t("design.frame.tip")} wide>
        <div className="frame-grid" role="radiogroup" aria-label={t("design.frame")}>
          {FRAMES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={frame.id === option.id}
              className="frame-tile"
              data-active={frame.id === option.id || undefined}
              onClick={() => setFrame({ id: option.id })}
            >
              <span
                className="frame-tile__shape"
                data-frame={option.id}
                style={{ aspectRatio: String(option.aspect) }}
                aria-hidden="true"
              />
              <span className="shape-tile__label">{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      </Field>

      {frame.id === "rounded" || frame.id === "portrait" || frame.id === "landscape" ? (
        <Slider
          label={t("design.cornerRadius")}
          value={Math.round(frame.cornerRadius * 100)}
          min={0}
          max={100}
          format={(value) => t("common.percent", { n: value })}
          onChange={(value) => setFrame({ cornerRadius: value / 100 })}
        />
      ) : null}

      {frame.id === "portrait" || frame.id === "landscape" ? (
        <Field label={t("design.frameLabel")} htmlFor="frame-label" wide help={t("design.frameLabel.help")}>
          <input
            id="frame-label"
            className="input"
            type="text"
            maxLength={28}
            value={frame.label}
            placeholder="SCAN ME"
            onChange={(event) => setFrame({ label: event.target.value })}
          />
        </Field>
      ) : null}
    </>
  );
}

function ReliabilityControls() {
  const t = useT();
  const quietZone = useStudio((state) => state.design.quietZone);
  const setQuietZone = useStudio((state) => state.setQuietZone);
  const ecc = useStudio((state) => state.ecc);
  const setEcc = useStudio((state) => state.setEcc);

  return (
    <>
      <Field label={t("design.quietZone")} tooltip={t("design.quietZone.tip")} wide>
        <div className="quiet-presets">
          {QUIET_PRESETS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={quietZone === option.value ? "primary" : "ghost"}
              aria-pressed={quietZone === option.value}
              onClick={() => setQuietZone(option.value)}
            >
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
      </Field>

      <Slider
        label={t("design.quietCustom")}
        value={quietZone}
        min={0}
        max={10}
        format={(value) => t("common.modules", { n: value })}
        onChange={setQuietZone}
      />

      <Field label={t("design.ecc")} tooltip={t("design.ecc.tip")} wide help={t(ECC_DETAIL[ecc])}>
        <Segmented
          label={t("design.ecc")}
          value={ecc}
          options={ECC_LEVELS.map((level) => ({
            value: level,
            label: `${level} · ${t(ECC_TITLE[level])}`,
            title: t(ECC_DETAIL[level]),
          }))}
          onChange={(level) => setEcc(level as EccLevel)}
        />
      </Field>
    </>
  );
}

export function DesignPanel() {
  const t = useT();
  const randomise = useStudio((state) => state.randomise);
  const resetDesign = useStudio((state) => state.resetDesign);

  return (
    <Card
      title={t("design.title")}
      description={t("design.description")}
      aside={
        <div className="card__actions">
          <Button size="sm" variant="ghost" onClick={randomise}>
            {t("design.random")}
          </Button>
          <Button size="sm" variant="ghost" onClick={resetDesign}>
            {t("design.reset")}
          </Button>
        </div>
      }
    >
      <DotShapePicker />
      <Accordion title={t("design.finders")} description={t("design.finders.description")} defaultOpen>
        <EyeShapePicker />
      </Accordion>
      <Accordion title={t("design.frameSection")} description={t("design.frameSection.description")}>
        <FrameControls />
      </Accordion>
      <Accordion title={t("design.reliability")} description={t("design.reliability.description")} defaultOpen>
        <ReliabilityControls />
      </Accordion>
    </Card>
  );
}
