import type { Corners } from "../geometry";
import { circlePath, polygon, roundedRect, star } from "../geometry";
import type { DotContext, DotShapeDef, DotShapeId, Neighbors } from "../types";

/**
 * Module shape registry.
 *
 * Adding a shape is a two step job: write a `DotShapeDef` below and add its
 * id to `DotShapeId` in ../types.ts. Nothing else in the app needs to change —
 * the picker, the randomiser and the validator all read this registry.
 */

/** A corner is "free" when neither of the two edges it touches has a neighbour. */
function freeCorners({ north, east, south, west }: Neighbors): [boolean, boolean, boolean, boolean] {
  return [!north && !west, !north && !east, !south && !east, !south && !west];
}

/** Rounds only the corners that stick out, so adjacent modules still merge cleanly. */
function adaptive(neighbors: Neighbors, radius: number): Corners {
  const [tl, tr, br, bl] = freeCorners(neighbors);
  return [tl ? radius : 0, tr ? radius : 0, br ? radius : 0, bl ? radius : 0];
}

const squareShape: DotShapeDef = {
  id: "square",
  labelKey: "shape.square",
  coverage: 1,
  path: ({ x, y }) => roundedRect(x, y, 1, 1, [0, 0, 0, 0]),
};

const roundedShape: DotShapeDef = {
  id: "rounded",
  labelKey: "shape.rounded",
  coverage: 0.96,
  path: ({ x, y, neighbors }) => roundedRect(x, y, 1, 1, adaptive(neighbors, 0.28)),
};

const extraRoundedShape: DotShapeDef = {
  id: "extra-rounded",
  labelKey: "shape.extra-rounded",
  coverage: 0.9,
  path: ({ x, y, neighbors }) => roundedRect(x, y, 1, 1, adaptive(neighbors, 0.5)),
};

const circleShape: DotShapeDef = {
  id: "circle",
  labelKey: "shape.circle",
  coverage: 0.79,
  path: ({ x, y }) => circlePath(x + 0.5, y + 0.5, 0.5),
};

const dotShape: DotShapeDef = {
  id: "dot",
  labelKey: "shape.dot",
  coverage: 0.6,
  path: ({ x, y }) => circlePath(x + 0.5, y + 0.5, 0.44),
};

const diamondShape: DotShapeDef = {
  id: "diamond",
  labelKey: "shape.diamond",
  coverage: 0.56,
  path: ({ x, y }) => polygon(x + 0.5, y + 0.5, 0.53, 4, 45),
};

/** Two opposite corners fully round, the other two sharp. */
const classyShape: DotShapeDef = {
  id: "classy",
  labelKey: "shape.classy",
  coverage: 0.86,
  path: ({ x, y, neighbors }) => {
    const [tl, , br] = freeCorners(neighbors);
    return roundedRect(x, y, 1, 1, [tl ? 0.5 : 0, 0, br ? 0.5 : 0, 0]);
  },
};

const classyRoundedShape: DotShapeDef = {
  id: "classy-rounded",
  labelKey: "shape.classy-rounded",
  coverage: 0.84,
  path: ({ x, y, neighbors }) => {
    const [tl, tr, br, bl] = freeCorners(neighbors);
    return roundedRect(x, y, 1, 1, [tl ? 0.5 : 0, tr ? 0.2 : 0, br ? 0.5 : 0, bl ? 0.2 : 0]);
  },
};

const hexagonShape: DotShapeDef = {
  id: "hexagon",
  labelKey: "shape.hexagon",
  coverage: 0.65,
  path: ({ x, y }) => polygon(x + 0.5, y + 0.5, 0.55, 6, 90),
};

/**
 * Deliberately sparse. Kept because the round-trip validator catches the cases
 * where it goes too far, which is exactly the safety net the studio promises.
 */
const starShape: DotShapeDef = {
  id: "star",
  labelKey: "shape.star",
  experimental: true,
  coverage: 0.4,
  path: ({ x, y }) => star(x + 0.5, y + 0.5, 0.6, 0.27, 5),
};

export const DOT_SHAPES: ReadonlyArray<DotShapeDef> = [
  squareShape,
  roundedShape,
  extraRoundedShape,
  circleShape,
  dotShape,
  diamondShape,
  classyShape,
  classyRoundedShape,
  hexagonShape,
  starShape,
];

const BY_ID = new Map<DotShapeId, DotShapeDef>(DOT_SHAPES.map((shape) => [shape.id, shape]));

export function getDotShape(id: DotShapeId): DotShapeDef {
  return BY_ID.get(id) ?? squareShape;
}

export function dotPath(id: DotShapeId, ctx: DotContext): string {
  return getDotShape(id).path(ctx);
}
