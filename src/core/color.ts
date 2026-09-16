/**
 * Colour utilities.
 *
 * Every colour that reaches the SVG goes through `safeColor` first. Colours are
 * user input that ends up inside an attribute value, so restricting them to a
 * strict hex grammar removes a whole class of injection worries in one step.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#?([0-9a-f]{3,8})$/i;

/** Returns a canonical `#rrggbb` / `#rrggbbaa` string, or null when invalid. */
export function normaliseHex(input: string): string | null {
  const match = HEX.exec(input.trim());
  if (!match) return null;
  const body = match[1]!.toLowerCase();

  if (body.length === 3 || body.length === 4) {
    const expanded = body
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded}`;
  }
  if (body.length === 6 || body.length === 8) return `#${body}`;
  return null;
}

/** Hex in, hex out. Anything else falls back — nothing else ever reaches the SVG. */
export function safeColor(value: string | undefined | null, fallback = "#000000"): string {
  if (!value) return fallback;
  return normaliseHex(value) ?? fallback;
}

function hexToRgb(hex: string): Rgb {
  const normalised = normaliseHex(hex) ?? "#000000";
  const body = normalised.slice(1);
  return {
    r: Number.parseInt(body.slice(0, 2), 16),
    g: Number.parseInt(body.slice(2, 4), 16),
    b: Number.parseInt(body.slice(4, 6), 16),
    a: body.length === 8 ? Number.parseInt(body.slice(6, 8), 16) / 255 : 1,
  };
}

export function rgbToHex({ r, g, b }: Pick<Rgb, "r" | "g" | "b">): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
