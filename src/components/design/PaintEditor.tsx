import { solidPaint } from "../../core/render/paint";
import type { GradientKind, Paint } from "../../core/render/types";
import { useT } from "../../hooks/useT";
import { Button, ColorField, Segmented, Slider } from "../ui/controls";

interface PaintEditorProps {
  label: string;
  paint: Paint | null;
  /** Used as the preview when `paint` is null (inherited). */
  inheritedFrom?: Paint;
  inheritLabel?: string;
  tooltip?: string;
  allowGradient?: boolean;
  onChange(paint: Paint | null): void;
}

/**
 * Edits one paint slot: a solid colour or a two-stop gradient.
 * Eye slots may also inherit, which is how "same as the modules" is expressed.
 */
export function PaintEditor({
  label,
  paint,
  inheritedFrom,
  inheritLabel,
  tooltip,
  allowGradient = true,
  onChange,
}: PaintEditorProps) {
  const t = useT();
  const inheriting = paint === null;
  const active = paint ?? inheritedFrom ?? solidPaint("#000000");

  const setMode = (mode: Paint["mode"]) => {
    if (mode === "gradient") {
      onChange({
        mode: "gradient",
        color: active.color,
        gradient: {
          kind: active.gradient.kind,
          from: active.gradient.from === active.gradient.to ? active.color : active.gradient.from,
          to: active.gradient.to === active.gradient.from ? "#4f46e5" : active.gradient.to,
          angle: active.gradient.angle,
        },
      });
    } else {
      onChange(solidPaint(active.mode === "gradient" ? active.gradient.from : active.color));
    }
  };

  return (
    <div className="paint-editor">
      <div className="paint-editor__head">
        <span className="paint-editor__label">{label}</span>
        {inheritedFrom ? (
          <Button
            size="sm"
            variant={inheriting ? "primary" : "ghost"}
            aria-pressed={inheriting}
            onClick={() => onChange(inheriting ? solidPaint(active.color) : null)}
          >
            {inheritLabel ?? t("colors.inheritDots")}
          </Button>
        ) : null}
      </div>

      {inheriting ? null : (
        <>
          {allowGradient ? (
            <Segmented
              label={t("colors.fillTypeOf", { label })}
              value={active.mode}
              options={[
                { value: "solid", label: t("colors.solid") },
                { value: "gradient", label: t("colors.gradient") },
              ]}
              onChange={(mode) => setMode(mode as Paint["mode"])}
            />
          ) : null}

          {active.mode === "solid" ? (
            <ColorField
              label={t("colors.colourOf", { label })}
              value={active.color}
              tooltip={tooltip}
              onChange={(color) => onChange(solidPaint(color))}
            />
          ) : (
            <div className="gradient-editor">
              <Segmented
                label={t("colors.gradientTypeOf", { label })}
                value={active.gradient.kind}
                options={[
                  { value: "linear", label: t("colors.linear") },
                  { value: "radial", label: t("colors.radial") },
                ]}
                onChange={(kind) =>
                  onChange({ ...active, gradient: { ...active.gradient, kind: kind as GradientKind } })
                }
              />
              <div className="gradient-editor__colors">
                <ColorField
                  label={t("colors.stopOne")}
                  value={active.gradient.from}
                  onChange={(from) => onChange({ ...active, gradient: { ...active.gradient, from } })}
                />
                <ColorField
                  label={t("colors.stopTwo")}
                  value={active.gradient.to}
                  onChange={(to) => onChange({ ...active, gradient: { ...active.gradient, to } })}
                />
              </div>
              {active.gradient.kind === "linear" ? (
                <Slider
                  label={t("colors.angle")}
                  value={active.gradient.angle}
                  min={0}
                  max={359}
                  step={1}
                  format={(value) => t("common.degrees", { n: value })}
                  onChange={(angle) => onChange({ ...active, gradient: { ...active.gradient, angle } })}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
