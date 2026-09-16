import type { TranslationKey } from "../../i18n/en";
import type { EccLevel } from "../encode/qrEngine";

/* ------------------------------------------------------------------ *
 * Minimal SVG description tree.
 *
 * The renderer never touches the DOM or builds HTML strings directly.
 * It returns this structure, which `mount.ts` turns into real DOM nodes
 * and `serialize.ts` turns into an export string. That keeps the whole
 * render pipeline pure, testable in node, and free of innerHTML.
 * ------------------------------------------------------------------ */

export interface SvgNode {
  tag: string;
  attrs?: Record<string, string | number | undefined>;
  children?: SvgNode[];
  /** Text content, escaped on serialisation. Only used by <text> and <style>. */
  text?: string;
}

/* ------------------------------------------------------------------ *
 * Design specification
 * ------------------------------------------------------------------ */

export type DotShapeId =
  | "square"
  | "rounded"
  | "extra-rounded"
  | "circle"
  | "dot"
  | "diamond"
  | "classy"
  | "classy-rounded"
  | "hexagon"
  | "star";

export type EyeOuterId = "square" | "rounded" | "extra-rounded" | "circle" | "leaf";
export type EyeInnerId = "square" | "rounded" | "circle" | "dot" | "diamond" | "leaf";
export type FrameId = "none" | "square" | "rounded" | "circle" | "portrait" | "landscape";

export type GradientKind = "linear" | "radial";

export interface Paint {
  mode: "solid" | "gradient";
  color: string;
  gradient: {
    kind: GradientKind;
    from: string;
    to: string;
    /** Degrees, 0 = left to right, clockwise. */
    angle: number;
  };
}

export type LogoPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface LogoSpec {
  /** Data URL only — remote URLs would taint the export canvas and leak requests. */
  src: string;
  /** Natural aspect ratio (width / height) so we never distort the artwork. */
  aspect: number;
  /** Fraction of the QR matrix width, 0.08 - 0.34. */
  size: number;
  position: LogoPosition;
  /** Extra clear space around the logo, in modules. */
  padding: number;
  background: boolean;
  backgroundColor: string;
  /** 0 = square plate, 1 = fully round plate. */
  cornerRadius: number;
}

export interface FrameSpec {
  id: FrameId;
  label: string;
  labelColor: string;
  /** 0 - 1, share of the plate corner that is rounded. */
  cornerRadius: number;
}

export interface DesignSpec {
  dots: { shape: DotShapeId; paint: Paint };
  eyes: {
    /** When true the three finders share one style — the common case. */
    linked: boolean;
    outer: EyeOuterId;
    inner: EyeInnerId;
    /** `null` means "inherit the dot paint". */
    outerPaint: Paint | null;
    innerPaint: Paint | null;
  };
  background: {
    paint: Paint;
    transparent: boolean;
  };
  /** Quiet zone in modules. 4 is the value the QR specification asks for. */
  quietZone: number;
  frame: FrameSpec;
  logo: LogoSpec | null;
}

/* ------------------------------------------------------------------ *
 * Render output
 * ------------------------------------------------------------------ */

export interface RenderGeometry {
  /** viewBox dimensions, in module units. */
  viewWidth: number;
  viewHeight: number;
  /** Top-left of the QR matrix inside the viewBox, in module units. */
  qrX: number;
  qrY: number;
  modules: number;
  quietZone: number;
  /** Logo bounding box in module units, if a logo is drawn. */
  logoRect: { x: number; y: number; width: number; height: number } | null;
}

export interface RenderResult {
  root: SvgNode;
  geometry: RenderGeometry;
  ecc: EccLevel;
  version: number;
  /** Data-area modules knocked out by the logo, used by the validator. */
  obscuredModules: number;
}

/* ------------------------------------------------------------------ *
 * Shape registries
 * ------------------------------------------------------------------ */

export interface Neighbors {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export interface DotContext {
  /** Module column / row, used as the top-left corner in module units. */
  x: number;
  y: number;
  neighbors: Neighbors;
}

export interface DotShapeDef {
  id: DotShapeId;
  labelKey: TranslationKey;
  /** Marks shapes that trade scan margin for looks. */
  experimental?: boolean;
  /** Approximate share of a module cell the shape fills — feeds the validator. */
  coverage: number;
  path(ctx: DotContext): string;
}

export interface EyeOuterDef {
  id: EyeOuterId;
  labelKey: TranslationKey;
  /** Path for the 7x7 ring drawn at (x, y), using the even-odd fill rule. */
  path(x: number, y: number): string;
}

export interface EyeInnerDef {
  id: EyeInnerId;
  labelKey: TranslationKey;
  /** Path for the 3x3 pupil drawn at (x, y). */
  path(x: number, y: number): string;
}
