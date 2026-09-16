import type { Corners } from "../geometry";
import { circlePath, polygon, roundedRect } from "../geometry";
import type { EyeInnerDef, EyeInnerId, EyeOuterDef, EyeOuterId } from "../types";

/**
 * Finder pattern registry.
 *
 * A finder is a 7x7 ring with a 3x3 pupil. The ring is drawn as a single path
 * with `fill-rule="evenodd"`: the 5x5 inner sub-path punches the hole, which
 * keeps the ring one element instead of three stacked rectangles.
 */

const OUTER = 7;
const HOLE = 5;
const PUPIL = 3;

function ring(x: number, y: number, corners: Corners): string {
  const inner = corners.map((r) => Math.max(0, r - 1)) as Corners;
  return (
    roundedRect(x, y, OUTER, OUTER, corners) + roundedRect(x + 1, y + 1, HOLE, HOLE, inner)
  );
}

const uniform = (radius: number): Corners => [radius, radius, radius, radius];

const outerShapes: ReadonlyArray<EyeOuterDef> = [
  { id: "square", labelKey: "shape.square", path: (x, y) => ring(x, y, uniform(0)) },
  { id: "rounded", labelKey: "shape.rounded", path: (x, y) => ring(x, y, uniform(1.6)) },
  { id: "extra-rounded", labelKey: "shape.extra-rounded", path: (x, y) => ring(x, y, uniform(2.6)) },
  { id: "circle", labelKey: "shape.circle", path: (x, y) => ring(x, y, uniform(3.5)) },
  { id: "leaf", labelKey: "shape.leaf", path: (x, y) => ring(x, y, [3.5, 0, 3.5, 0]) },
];

const innerShapes: ReadonlyArray<EyeInnerDef> = [
  { id: "square", labelKey: "shape.square", path: (x, y) => roundedRect(x, y, PUPIL, PUPIL, uniform(0)) },
  { id: "rounded", labelKey: "shape.rounded", path: (x, y) => roundedRect(x, y, PUPIL, PUPIL, uniform(0.85)) },
  { id: "circle", labelKey: "shape.circle", path: (x, y) => circlePath(x + 1.5, y + 1.5, 1.5) },
  { id: "dot", labelKey: "shape.dot", path: (x, y) => circlePath(x + 1.5, y + 1.5, 1.2) },
  { id: "diamond", labelKey: "shape.diamond", path: (x, y) => polygon(x + 1.5, y + 1.5, 1.7, 4, 45) },
  { id: "leaf", labelKey: "shape.leaf", path: (x, y) => roundedRect(x, y, PUPIL, PUPIL, [1.5, 0, 1.5, 0]) },
];

export const EYE_OUTER_SHAPES = outerShapes;
export const EYE_INNER_SHAPES = innerShapes;

const OUTER_BY_ID = new Map<EyeOuterId, EyeOuterDef>(outerShapes.map((shape) => [shape.id, shape]));
const INNER_BY_ID = new Map<EyeInnerId, EyeInnerDef>(innerShapes.map((shape) => [shape.id, shape]));

export function eyeOuterPath(id: EyeOuterId, x: number, y: number): string {
  return (OUTER_BY_ID.get(id) ?? outerShapes[0]!).path(x, y);
}

export function eyeInnerPath(id: EyeInnerId, x: number, y: number): string {
  return (INNER_BY_ID.get(id) ?? innerShapes[0]!).path(x, y);
}
