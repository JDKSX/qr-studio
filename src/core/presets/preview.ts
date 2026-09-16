import { encodeMatrix } from "../encode/qrEngine";
import { renderQR } from "../render/renderer";
import type { SvgNode } from "../render/types";
import type { DesignPreset } from "./design";

/**
 * A real, tiny QR rendered with the preset's own design.
 *
 * Swatches of two colours tell you almost nothing about what a preset will
 * look like. Drawing the actual code — same shapes, same gradient, same
 * finders — lets someone pick a style in one glance instead of clicking
 * through all ten.
 */

/** Short and alphanumeric, so every preview is a compact version 1 code. */
const PREVIEW_PAYLOAD = "JDKS";

const cache = new Map<string, SvgNode | null>();

export function presetPreview(preset: DesignPreset): SvgNode | null {
  const cached = cache.get(preset.id);
  if (cached !== undefined) return cached;

  const result = encodeMatrix(PREVIEW_PAYLOAD, preset.ecc ?? "M");
  if (!result.ok) {
    cache.set(preset.id, null);
    return null;
  }

  const node = renderQR(result.matrix, {
    ...preset.design,
    logo: null,
    // A thumbnail has no room for a label or a generous margin.
    quietZone: 2,
    frame: { ...preset.design.frame, label: "" },
  }).root;

  cache.set(preset.id, node);
  return node;
}
