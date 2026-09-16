/** Path building helpers shared by every shape in the registries. */

/** Trims float noise so the exported SVG stays small and diff-friendly. */
export function n(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export type Corners = [topLeft: number, topRight: number, bottomRight: number, bottomLeft: number];

/**
 * Rounded rectangle with independent corner radii.
 * Radii are clamped so opposite corners can never overlap — a radius of
 * half the side length produces a true circle, which is how the `circle`
 * dot and eye shapes are built.
 */
export function roundedRect(x: number, y: number, w: number, h: number, corners: Corners): string {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = corners.map((r) => Math.max(0, Math.min(r, max))) as Corners;

  return [
    `M${n(x + tl)} ${n(y)}`,
    `H${n(x + w - tr)}`,
    tr ? `A${n(tr)} ${n(tr)} 0 0 1 ${n(x + w)} ${n(y + tr)}` : "",
    `V${n(y + h - br)}`,
    br ? `A${n(br)} ${n(br)} 0 0 1 ${n(x + w - br)} ${n(y + h)}` : "",
    `H${n(x + bl)}`,
    bl ? `A${n(bl)} ${n(bl)} 0 0 1 ${n(x)} ${n(y + h - bl)}` : "",
    `V${n(y + tl)}`,
    tl ? `A${n(tl)} ${n(tl)} 0 0 1 ${n(x + tl)} ${n(y)}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join("");
}

/** Regular polygon inscribed in the cell, `rotation` in degrees. */
export function polygon(cx: number, cy: number, radius: number, sides: number, rotation = 0): string {
  const start = (rotation * Math.PI) / 180;
  const points: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = start + (i * 2 * Math.PI) / sides;
    points.push(`${n(cx + radius * Math.cos(angle))} ${n(cy + radius * Math.sin(angle))}`);
  }
  return `M${points.join("L")}Z`;
}

/** Alternating outer/inner radius star. */
export function star(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const step = Math.PI / points;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + i * step;
    parts.push(`${n(cx + radius * Math.cos(angle))} ${n(cy + radius * Math.sin(angle))}`);
  }
  return `M${parts.join("L")}Z`;
}

/** Circle expressed as a path so every shape can share one <path> element. */
export function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M${n(cx - r)} ${n(cy)}` +
    `a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0` +
    `a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`
  );
}
