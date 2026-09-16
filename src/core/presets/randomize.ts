import { contrastRatio, rgbToHex } from "../color";
import { DOT_SHAPES } from "../render/dots";
import { EYE_INNER_SHAPES, EYE_OUTER_SHAPES } from "../render/eyes";
import { solidPaint } from "../render/paint";
import type { DesignSpec, DotShapeId, EyeInnerId, EyeOuterId, FrameId } from "../render/types";
import { cloneDesign, gradientPaint } from "./design";

function pick<T>(items: ReadonlyArray<T>): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function hslToHex(h: number, s: number, l: number): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  const sector = Math.floor(h / 60) % 6;
  const table: Array<[number, number, number]> = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ];
  const [r, g, b] = table[sector]!;
  return rgbToHex({ r: (r + match) * 255, g: (g + match) * 255, b: (b + match) * 255 });
}

const FRAME_CHOICES: ReadonlyArray<FrameId> = ["none", "square", "rounded", "rounded", "circle"];

/**
 * Produces a random design that still passes the contrast bar.
 *
 * Scanability is not negotiable, so the palette is resampled until the
 * foreground and background are at least 7:1 apart. Experimental module shapes
 * are heavily down-weighted rather than excluded.
 */
export function randomDesign(current: DesignSpec): DesignSpec {
  const next = cloneDesign(current);

  const shapes = Math.random() < 0.85 ? DOT_SHAPES.filter((shape) => !shape.experimental) : DOT_SHAPES;
  const dotShape: DotShapeId = pick(shapes).id;
  const outer: EyeOuterId = pick(EYE_OUTER_SHAPES).id;
  const inner: EyeInnerId = pick(EYE_INNER_SHAPES).id;

  const darkMode = Math.random() < 0.25;
  let foreground = "#000000";
  let secondary = "#000000";
  let background = "#ffffff";

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const hue = Math.floor(Math.random() * 360);
    if (darkMode) {
      foreground = hslToHex(hue, 0.55 + Math.random() * 0.35, 0.78 + Math.random() * 0.14);
      secondary = hslToHex((hue + 40) % 360, 0.6, 0.8);
      background = hslToHex((hue + 200) % 360, 0.25, 0.07 + Math.random() * 0.05);
    } else {
      foreground = hslToHex(hue, 0.6 + Math.random() * 0.35, 0.18 + Math.random() * 0.16);
      secondary = hslToHex((hue + 45) % 360, 0.7, 0.32);
      background = hslToHex((hue + 180) % 360, 0.35, 0.95 + Math.random() * 0.04);
    }
    if (contrastRatio(foreground, background) >= 7 && contrastRatio(secondary, background) >= 7) break;
  }

  const useGradient = Math.random() < 0.4;

  next.dots = {
    shape: dotShape,
    paint: useGradient
      ? gradientPaint(foreground, secondary, Math.floor(Math.random() * 8) * 45)
      : solidPaint(foreground),
  };
  next.eyes = {
    linked: true,
    outer,
    inner,
    outerPaint: Math.random() < 0.5 ? solidPaint(secondary) : null,
    innerPaint: Math.random() < 0.35 ? solidPaint(foreground) : null,
  };
  next.background = { paint: solidPaint(background), transparent: false };
  next.quietZone = 4 + Math.floor(Math.random() * 3);
  next.frame = {
    ...next.frame,
    id: pick(FRAME_CHOICES),
    cornerRadius: Math.round(Math.random() * 10) / 10,
    labelColor: foreground,
  };

  return next;
}
