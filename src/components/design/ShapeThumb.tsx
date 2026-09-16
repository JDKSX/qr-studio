import { dotPath } from "../../core/render/dots";
import { eyeInnerPath, eyeOuterPath } from "../../core/render/eyes";
import type { DotShapeId, EyeInnerId, EyeOuterId } from "../../core/render/types";

/**
 * Thumbnails are drawn with the same registry functions as the real code, so
 * what the picker shows is literally what the QR will use.
 */

/** A 4x4 sample with enough adjacency to reveal neighbour-aware rounding. */
const SAMPLE: ReadonlyArray<ReadonlyArray<number>> = [
  [1, 1, 0, 1],
  [1, 1, 1, 0],
  [0, 1, 1, 1],
  [1, 0, 1, 1],
];

const filled = (row: number, col: number): boolean => SAMPLE[row]?.[col] === 1;

export function DotThumb({ shape }: { shape: DotShapeId }) {
  const paths: string[] = [];
  for (let row = 0; row < SAMPLE.length; row += 1) {
    for (let col = 0; col < SAMPLE.length; col += 1) {
      if (!filled(row, col)) continue;
      paths.push(
        dotPath(shape, {
          x: col,
          y: row,
          neighbors: {
            north: filled(row - 1, col),
            east: filled(row, col + 1),
            south: filled(row + 1, col),
            west: filled(row, col - 1),
          },
        }),
      );
    }
  }

  return (
    <svg viewBox="-0.3 -0.3 4.6 4.6" aria-hidden="true" className="thumb">
      <path d={paths.join("")} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

export function EyeThumb({ outer, inner }: { outer: EyeOuterId; inner: EyeInnerId }) {
  return (
    <svg viewBox="-0.4 -0.4 7.8 7.8" aria-hidden="true" className="thumb">
      <path d={eyeOuterPath(outer, 0, 0)} fill="currentColor" fillRule="evenodd" />
      <path d={eyeInnerPath(inner, 2, 2)} fill="currentColor" />
    </svg>
  );
}
