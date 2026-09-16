import { safeColor } from "../color";
import type { QRMatrix } from "../encode/qrEngine";
import { dotPath } from "./dots";
import { eyeInnerPath, eyeOuterPath } from "./eyes";
import { getFrame } from "./frames";
import { n, roundedRect } from "./geometry";
import { resolvePaint } from "./paint";
import type {
  DesignSpec,
  LogoSpec,
  Neighbors,
  RenderGeometry,
  RenderResult,
  SvgNode,
} from "./types";

export interface RenderOptions {
  /** Accessible name written into <title>. Never contains the payload. */
  title?: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where the logo sits inside the matrix, in module units. */
function logoLayout(logo: LogoSpec, modules: number): Rect {
  const maxSide = Math.max(0.05, Math.min(0.4, logo.size)) * modules;
  const aspect = logo.aspect > 0 && Number.isFinite(logo.aspect) ? logo.aspect : 1;
  const width = aspect >= 1 ? maxSide : maxSide * aspect;
  const height = aspect >= 1 ? maxSide / aspect : maxSide;

  const inset = 1;
  const minX = inset;
  const maxX = modules - width - inset;
  const minY = inset;
  const maxY = modules - height - inset;
  const midX = (modules - width) / 2;
  const midY = (modules - height) / 2;

  const horizontal = logo.position.includes("left")
    ? minX
    : logo.position.includes("right")
      ? maxX
      : midX;
  const vertical = logo.position.startsWith("top")
    ? minY
    : logo.position.startsWith("bottom")
      ? maxY
      : logo.position === "top"
        ? minY
        : logo.position === "bottom"
          ? maxY
          : midY;

  return {
    x: Math.max(0, Math.min(horizontal, modules - width)),
    y: Math.max(0, Math.min(vertical, modules - height)),
    width,
    height,
  };
}

function inflate(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  };
}

function contains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/**
 * Turns a matrix plus a design into an SVG description tree.
 *
 * The whole function is pure: same inputs, same output, no DOM access. The
 * viewBox is expressed in module units, so the same tree serves the on-screen
 * preview, a 512px PNG and a 4096px PNG without re-rendering.
 */
export function renderQR(
  matrix: QRMatrix,
  design: DesignSpec,
  options: RenderOptions = {},
): RenderResult {
  const modules = matrix.size;
  const quiet = Math.max(0, Math.round(design.quietZone));
  const frame = getFrame(design.frame.id);
  const plated = !design.background.transparent && design.frame.id !== "none";

  const baseContext = {
    modules,
    quiet,
    fill: "none",
    plated: false,
    label: design.frame.label,
    labelColor: safeColor(design.frame.labelColor, "#111827"),
    cornerRadius: Math.max(0, Math.min(1, design.frame.cornerRadius)),
  };

  // First pass gives us the viewBox, which the background gradient needs.
  const probe = frame.layout(baseContext);
  const background = resolvePaint(design.background.paint, "jdks-bg", {
    x: 0,
    y: 0,
    width: probe.width,
    height: probe.height,
  });

  const layout = frame.layout({ ...baseContext, fill: background.fill, plated });
  const { qrX, qrY } = layout;

  const matrixBox = { x: qrX, y: qrY, width: modules, height: modules };
  const dots = resolvePaint(design.dots.paint, "jdks-dots", matrixBox);
  const eyeOuter = resolvePaint(design.eyes.outerPaint ?? design.dots.paint, "jdks-eye", matrixBox);
  const eyeInner = resolvePaint(
    design.eyes.innerPaint ?? design.eyes.outerPaint ?? design.dots.paint,
    "jdks-pupil",
    matrixBox,
  );

  const logo = design.logo;
  const logoRect = logo ? logoLayout(logo, modules) : null;
  const knockout = logo && logoRect ? inflate(logoRect, Math.max(0, logo.padding)) : null;

  /** A module is painted when it is dark, outside the finders and not under the logo. */
  const isPainted = (row: number, col: number): boolean => {
    if (!matrix.isDark(row, col)) return false;
    if (matrix.isFinder(row, col)) return false;
    if (knockout && contains(knockout, col + 0.5, row + 0.5)) return false;
    return true;
  };

  // Every module under the logo is lost, light ones included: error correction
  // works on codewords, and a light module carries just as much of one.
  let obscuredModules = 0;
  const paths: string[] = [];

  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      const covered = knockout ? contains(knockout, col + 0.5, row + 0.5) : false;
      if (covered && !matrix.isFinder(row, col)) obscuredModules += 1;
      if (!matrix.isDark(row, col) || matrix.isFinder(row, col)) continue;
      if (covered) continue;
      const neighbors: Neighbors = {
        north: isPainted(row - 1, col),
        east: isPainted(row, col + 1),
        south: isPainted(row + 1, col),
        west: isPainted(row, col - 1),
      };
      paths.push(dotPath(design.dots.shape, { x: qrX + col, y: qrY + row, neighbors }));
    }
  }

  const children: SvgNode[] = [];

  const defs: SvgNode[] = [background.def, dots.def, eyeOuter.def, eyeInner.def].filter(
    (def): def is SvgNode => def !== null,
  );
  if (defs.length) children.push({ tag: "defs", children: defs });

  children.push(...layout.below);

  if (paths.length) {
    children.push({
      tag: "path",
      attrs: { d: paths.join(""), fill: dots.fill, "fill-rule": "evenodd" },
    });
  }

  // Finder patterns, drawn after the data so they always stay crisp on top.
  const eyeOrigins: Array<[number, number]> = [
    [qrX, qrY],
    [qrX + modules - 7, qrY],
    [qrX, qrY + modules - 7],
  ];

  children.push({
    tag: "path",
    attrs: {
      d: eyeOrigins.map(([x, y]) => eyeOuterPath(design.eyes.outer, x, y)).join(""),
      fill: eyeOuter.fill,
      "fill-rule": "evenodd",
    },
  });
  children.push({
    tag: "path",
    attrs: {
      d: eyeOrigins.map(([x, y]) => eyeInnerPath(design.eyes.inner, x + 2, y + 2)).join(""),
      fill: eyeInner.fill,
    },
  });

  if (logo && logoRect) {
    const plate = inflate(logoRect, Math.max(0, logo.padding));
    if (logo.background) {
      const radius = (Math.min(plate.width, plate.height) / 2) * Math.max(0, Math.min(1, logo.cornerRadius));
      children.push({
        tag: "path",
        attrs: {
          d: roundedRect(qrX + plate.x, qrY + plate.y, plate.width, plate.height, [
            radius,
            radius,
            radius,
            radius,
          ]),
          fill: safeColor(logo.backgroundColor, "#ffffff"),
        },
      });
    }
    children.push({
      tag: "image",
      attrs: {
        href: logo.src,
        x: n(qrX + logoRect.x),
        y: n(qrY + logoRect.y),
        width: n(logoRect.width),
        height: n(logoRect.height),
        preserveAspectRatio: "xMidYMid meet",
      },
    });
  }

  children.push(...layout.above);

  if (options.title) {
    children.unshift({ tag: "title", attrs: { id: "jdks-qr-title" }, text: options.title });
  }

  const geometry: RenderGeometry = {
    viewWidth: layout.width,
    viewHeight: layout.height,
    qrX,
    qrY,
    modules,
    quietZone: quiet,
    logoRect,
  };

  const root: SvgNode = {
    tag: "svg",
    attrs: {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${n(layout.width)} ${n(layout.height)}`,
      role: "img",
      "aria-labelledby": options.title ? "jdks-qr-title" : undefined,
    },
    children,
  };

  return { root, geometry, ecc: matrix.ecc, version: matrix.version, obscuredModules };
}

/** Colours actually painted, for the contrast checker. */
export function paintSamples(design: DesignSpec): {
  foreground: string[];
  background: string[];
} {
  const sample = (paint: DesignSpec["dots"]["paint"]): string[] =>
    paint.mode === "gradient"
      ? [safeColor(paint.gradient.from), safeColor(paint.gradient.to, "#ffffff")]
      : [safeColor(paint.color)];

  const foreground = [
    ...sample(design.dots.paint),
    ...sample(design.eyes.outerPaint ?? design.dots.paint),
    ...sample(design.eyes.innerPaint ?? design.eyes.outerPaint ?? design.dots.paint),
  ];

  return { foreground, background: sample(design.background.paint) };
}
