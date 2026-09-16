import type { TranslationKey } from "../../../i18n/en";
import { circlePath, n, roundedRect } from "../geometry";
import type { FrameId, SvgNode } from "../types";

/**
 * Frame / canvas registry.
 *
 * A frame only ever describes the plate *behind* the code and decoration
 * *outside* the quiet zone. It is handed the module count and quiet zone and
 * must return an origin that keeps both intact — the data matrix is never
 * clipped, scaled or distorted by a frame.
 */

export interface FrameContext {
  /** QR matrix size in modules. */
  modules: number;
  /** Quiet zone in modules. */
  quiet: number;
  /** Fill for the plate: a colour or a `url(#id)` paint reference. */
  fill: string;
  /** Whether a plate should be drawn at all. */
  plated: boolean;
  label: string;
  labelColor: string;
  /** 0 - 1 share of the maximum corner rounding. */
  cornerRadius: number;
}

export interface FrameLayout {
  width: number;
  height: number;
  qrX: number;
  qrY: number;
  below: SvgNode[];
  above: SvgNode[];
}

export interface FrameDef {
  id: FrameId;
  labelKey: TranslationKey;
  /** Rough preview aspect for the picker thumbnails. */
  aspect: number;
  layout(ctx: FrameContext): FrameLayout;
}

const LABEL_FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

/** Approximates the rendered width of the label so it always fits its band. */
function fitFontSize(label: string, available: number, max: number): number {
  if (!label) return max;
  const estimated = available / (label.length * 0.62);
  return Math.max(0.9, Math.min(max, estimated));
}

function labelNode(
  label: string,
  color: string,
  cx: number,
  cy: number,
  fontSize: number,
): SvgNode | null {
  if (!label.trim()) return null;
  return {
    tag: "text",
    attrs: {
      x: n(cx),
      y: n(cy),
      fill: color,
      "font-family": LABEL_FONT,
      "font-size": n(fontSize),
      "font-weight": "700",
      "letter-spacing": n(fontSize * 0.08),
      "text-anchor": "middle",
      "dominant-baseline": "central",
    },
    text: label,
  };
}

function plateNode(path: string, fill: string): SvgNode {
  return { tag: "path", attrs: { d: path, fill } };
}

const noneFrame: FrameDef = {
  id: "none",
  labelKey: "frame.none",
  aspect: 1,
  layout: ({ modules, quiet }) => {
    const size = modules + quiet * 2;
    return { width: size, height: size, qrX: quiet, qrY: quiet, below: [], above: [] };
  },
};

const squareFrame: FrameDef = {
  id: "square",
  labelKey: "frame.square",
  aspect: 1,
  layout: ({ modules, quiet, fill, plated }) => {
    const size = modules + quiet * 2;
    return {
      width: size,
      height: size,
      qrX: quiet,
      qrY: quiet,
      below: plated ? [plateNode(roundedRect(0, 0, size, size, [0, 0, 0, 0]), fill)] : [],
      above: [],
    };
  },
};

const roundedFrame: FrameDef = {
  id: "rounded",
  labelKey: "frame.rounded",
  aspect: 1,
  layout: ({ modules, quiet, fill, plated, cornerRadius }) => {
    const size = modules + quiet * 2;
    const radius = (size / 2) * Math.max(0.05, cornerRadius);
    return {
      width: size,
      height: size,
      qrX: quiet,
      qrY: quiet,
      below: plated
        ? [plateNode(roundedRect(0, 0, size, size, [radius, radius, radius, radius]), fill)]
        : [],
      above: [],
    };
  },
};

const circleFrame: FrameDef = {
  id: "circle",
  labelKey: "frame.circle",
  aspect: 1,
  layout: ({ modules, quiet, fill, plated }) => {
    // The QR stays square; the circle is the smallest one that contains it.
    const content = modules + quiet * 2;
    const diameter = content * Math.SQRT2;
    const offset = (diameter - content) / 2;
    return {
      width: diameter,
      height: diameter,
      qrX: offset + quiet,
      qrY: offset + quiet,
      below: plated
        ? [plateNode(circlePath(diameter / 2, diameter / 2, diameter / 2), fill)]
        : [],
      above: [],
    };
  },
};

const BAND = 6;

const portraitFrame: FrameDef = {
  id: "portrait",
  labelKey: "frame.portrait",
  aspect: 0.82,
  layout: ({ modules, quiet, fill, plated, cornerRadius, label, labelColor }) => {
    const content = modules + quiet * 2;
    const height = content + BAND;
    const radius = (content / 2) * Math.max(0.05, cornerRadius);
    const fontSize = fitFontSize(label, content * 0.86, BAND * 0.52);
    const text = labelNode(label, labelColor, content / 2, content + BAND / 2, fontSize);
    return {
      width: content,
      height,
      qrX: quiet,
      qrY: quiet,
      below: plated
        ? [plateNode(roundedRect(0, 0, content, height, [radius, radius, radius, radius]), fill)]
        : [],
      above: text ? [text] : [],
    };
  },
};

const landscapeFrame: FrameDef = {
  id: "landscape",
  labelKey: "frame.landscape",
  aspect: 1.45,
  layout: ({ modules, quiet, fill, plated, cornerRadius, label, labelColor }) => {
    const content = modules + quiet * 2;
    const band = Math.max(BAND * 2, content * 0.45);
    const width = content + band;
    const radius = (content / 2) * Math.max(0.05, cornerRadius);
    const fontSize = fitFontSize(label, band * 0.84, content * 0.13);
    const text = labelNode(label, labelColor, content + band / 2, content / 2, fontSize);
    return {
      width,
      height: content,
      qrX: quiet,
      qrY: quiet,
      below: plated
        ? [plateNode(roundedRect(0, 0, width, content, [radius, radius, radius, radius]), fill)]
        : [],
      above: text ? [text] : [],
    };
  },
};

export const FRAMES: ReadonlyArray<FrameDef> = [
  noneFrame,
  squareFrame,
  roundedFrame,
  circleFrame,
  portraitFrame,
  landscapeFrame,
];

const BY_ID = new Map<FrameId, FrameDef>(FRAMES.map((frame) => [frame.id, frame]));

export function getFrame(id: FrameId): FrameDef {
  return BY_ID.get(id) ?? squareFrame;
}
