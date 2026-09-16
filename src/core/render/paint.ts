import { safeColor } from "../color";
import { n } from "./geometry";
import type { Paint, SvgNode } from "./types";

export interface PaintBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedPaint {
  /** Value for a `fill` attribute: either a hex colour or `url(#id)`. */
  fill: string;
  /** Gradient definition to append to <defs>, when the paint needs one. */
  def: SvgNode | null;
  /** The colours actually painted — the contrast checker samples these. */
  samples: string[];
}

export function solidPaint(color: string): Paint {
  return {
    mode: "solid",
    color,
    gradient: { kind: "linear", from: color, to: color, angle: 45 },
  };
}

/**
 * Gradients use `userSpaceOnUse` so one gradient spans the whole code.
 * With the default `objectBoundingBox` every module would get its own copy of
 * the ramp, which looks like noise rather than a gradient.
 */
export function resolvePaint(paint: Paint, id: string, box: PaintBox): ResolvedPaint {
  if (paint.mode !== "gradient") {
    const color = safeColor(paint.color);
    return { fill: color, def: null, samples: [color] };
  }

  const from = safeColor(paint.gradient.from);
  const to = safeColor(paint.gradient.to, "#ffffff");
  const stops: SvgNode[] = [
    { tag: "stop", attrs: { offset: "0", "stop-color": from } },
    { tag: "stop", attrs: { offset: "1", "stop-color": to } },
  ];

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  if (paint.gradient.kind === "radial") {
    return {
      fill: `url(#${id})`,
      samples: [from, to],
      def: {
        tag: "radialGradient",
        attrs: {
          id,
          gradientUnits: "userSpaceOnUse",
          cx: n(cx),
          cy: n(cy),
          r: n(Math.hypot(box.width, box.height) / 2),
        },
        children: stops,
      },
    };
  }

  const radians = (paint.gradient.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // Length of the gradient axis so the ramp always covers the full box.
  const length = Math.abs(box.width * cos) + Math.abs(box.height * sin);

  return {
    fill: `url(#${id})`,
    samples: [from, to],
    def: {
      tag: "linearGradient",
      attrs: {
        id,
        gradientUnits: "userSpaceOnUse",
        x1: n(cx - (cos * length) / 2),
        y1: n(cy - (sin * length) / 2),
        x2: n(cx + (cos * length) / 2),
        y2: n(cy + (sin * length) / 2),
      },
      children: stops,
    },
  };
}
