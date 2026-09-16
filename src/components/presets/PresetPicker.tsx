import { useMemo } from "react";
import { DESIGN_PRESETS } from "../../core/presets/design";
import { presetPreview } from "../../core/presets/preview";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { SvgFigure } from "../ui/SvgFigure";

/**
 * Style picker for the simple flow.
 *
 * Each tile is a real QR drawn with that preset, so choosing a look is one
 * glance instead of ten clicks. Previews are cached, so this costs nothing
 * after the first render.
 */
export function PresetPicker() {
  const t = useT();
  const applyPreset = useStudio((state) => state.applyPreset);
  const randomise = useStudio((state) => state.randomise);

  const tiles = useMemo(
    () => DESIGN_PRESETS.map((preset) => ({ preset, node: presetPreview(preset) })),
    [],
  );

  return (
    <>
      <div className="style-grid">
        {tiles.map(({ preset, node }) => (
          <button
            key={preset.id}
            type="button"
            className="style-tile"
            onClick={() => applyPreset(preset.id)}
            title={t(preset.descriptionKey)}
          >
            {node ? <SvgFigure node={node} className="style-tile__qr" /> : null}
            <span className="style-tile__name">{t(preset.nameKey)}</span>
          </button>
        ))}

        <button type="button" className="style-tile style-tile--random" onClick={randomise}>
          <span className="style-tile__dice" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <rect
                x="3.5"
                y="3.5"
                width="17"
                height="17"
                rx="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
              <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
              <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="style-tile__name">{t("simple.surprise")}</span>
        </button>
      </div>
      <p className="field__help">{t("simple.styleHint")}</p>
    </>
  );
}
