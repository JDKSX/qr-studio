import type { TranslationKey } from "../../i18n/en";
import type { EccLevel } from "../encode/qrEngine";
import { solidPaint } from "../render/paint";
import type { DesignSpec, GradientKind, Paint } from "../render/types";

/** Requirement-mandated factory settings: plain black square modules on white. */
export const DEFAULT_DESIGN: DesignSpec = {
  dots: { shape: "square", paint: solidPaint("#000000") },
  eyes: { linked: true, outer: "square", inner: "square", outerPaint: null, innerPaint: null },
  background: { paint: solidPaint("#ffffff"), transparent: false },
  quietZone: 4,
  frame: { id: "square", label: "SCAN ME", labelColor: "#111827", cornerRadius: 0.25 },
  logo: null,
};

export const DEFAULT_ECC: EccLevel = "M";

export function gradientPaint(from: string, to: string, angle = 45, kind: GradientKind = "linear"): Paint {
  return { mode: "gradient", color: from, gradient: { kind, from, to, angle } };
}

/** Deep clone so presets can never be mutated through the store. */
export function cloneDesign(design: DesignSpec): DesignSpec {
  return {
    dots: { shape: design.dots.shape, paint: { ...design.dots.paint, gradient: { ...design.dots.paint.gradient } } },
    eyes: {
      ...design.eyes,
      outerPaint: design.eyes.outerPaint
        ? { ...design.eyes.outerPaint, gradient: { ...design.eyes.outerPaint.gradient } }
        : null,
      innerPaint: design.eyes.innerPaint
        ? { ...design.eyes.innerPaint, gradient: { ...design.eyes.innerPaint.gradient } }
        : null,
    },
    background: {
      transparent: design.background.transparent,
      paint: { ...design.background.paint, gradient: { ...design.background.paint.gradient } },
    },
    quietZone: design.quietZone,
    frame: { ...design.frame },
    logo: design.logo ? { ...design.logo } : null,
  };
}

export interface DesignPreset {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  ecc?: EccLevel;
  /** Applied over `DEFAULT_DESIGN`; the logo is always left untouched. */
  design: Omit<DesignSpec, "logo">;
}

function preset(
  id: string,
  design: Partial<Omit<DesignSpec, "logo">>,
  ecc?: EccLevel,
): DesignPreset {
  const base = cloneDesign(DEFAULT_DESIGN);
  const merged: Omit<DesignSpec, "logo"> = {
    dots: design.dots ?? base.dots,
    eyes: { ...base.eyes, ...design.eyes },
    background: { ...base.background, ...design.background },
    quietZone: design.quietZone ?? base.quietZone,
    frame: { ...base.frame, ...design.frame },
  };
  const nameKey = `preset.${id}` as TranslationKey;
  const descriptionKey = `preset.${id}.description` as TranslationKey;
  return ecc
    ? { id, nameKey, descriptionKey, design: merged, ecc }
    : { id, nameKey, descriptionKey, design: merged };
}

export const DESIGN_PRESETS: ReadonlyArray<DesignPreset> = [
  preset("classic", {
    dots: { shape: "square", paint: solidPaint("#000000") },
    eyes: { linked: true, outer: "square", inner: "square", outerPaint: null, innerPaint: null },
  }),
  preset("modern", {
    dots: { shape: "rounded", paint: solidPaint("#2563eb") },
    eyes: { linked: true, outer: "rounded", inner: "rounded", outerPaint: null, innerPaint: null },
    frame: { id: "rounded", label: "SCAN ME", labelColor: "#111827", cornerRadius: 0.2 },
  }),
  preset("minimal", {
    dots: { shape: "dot", paint: solidPaint("#334155") },
    eyes: { linked: true, outer: "extra-rounded", inner: "circle", outerPaint: null, innerPaint: null },
    quietZone: 6,
  }),
  preset("corporate", {
    dots: { shape: "classy", paint: solidPaint("#0f172a") },
    eyes: {
      linked: true,
      outer: "square",
      inner: "square",
      outerPaint: solidPaint("#1d4ed8"),
      innerPaint: solidPaint("#0f172a"),
    },
  }),
  preset("elegant", {
    dots: { shape: "classy-rounded", paint: solidPaint("#3f3352") },
    eyes: {
      linked: true,
      outer: "leaf",
      inner: "leaf",
      outerPaint: solidPaint("#7c3aed"),
      innerPaint: null,
    },
    frame: { id: "rounded", label: "SCAN ME", labelColor: "#3f3352", cornerRadius: 0.35 },
  }),
  preset("cute", {
    dots: { shape: "circle", paint: solidPaint("#db2777") },
    eyes: {
      linked: true,
      outer: "circle",
      inner: "dot",
      outerPaint: solidPaint("#f472b6"),
      innerPaint: solidPaint("#be185d"),
    },
    background: { paint: solidPaint("#fff7ed"), transparent: false },
    frame: { id: "rounded", label: "SCAN ME", labelColor: "#be185d", cornerRadius: 0.4 },
  }),
  preset("dark", {
    dots: { shape: "rounded", paint: solidPaint("#f8fafc") },
    eyes: { linked: true, outer: "rounded", inner: "rounded", outerPaint: null, innerPaint: null },
    background: { paint: solidPaint("#0b0f19"), transparent: false },
    frame: { id: "rounded", label: "SCAN ME", labelColor: "#f8fafc", cornerRadius: 0.2 },
  }),
  preset("neon", {
      dots: { shape: "extra-rounded", paint: gradientPaint("#22d3ee", "#e879f9", 135) },
      eyes: {
        linked: true,
        outer: "extra-rounded",
        inner: "circle",
        outerPaint: solidPaint("#22d3ee"),
        innerPaint: solidPaint("#e879f9"),
      },
      background: { paint: solidPaint("#0b0f19"), transparent: false },
      frame: { id: "rounded", label: "SCAN ME", labelColor: "#22d3ee", cornerRadius: 0.3 },
    },
    "Q",
  ),
  preset("gradient", {
    dots: { shape: "rounded", paint: gradientPaint("#4f46e5", "#ec4899", 45) },
    eyes: {
      linked: true,
      outer: "extra-rounded",
      inner: "circle",
      outerPaint: gradientPaint("#4f46e5", "#ec4899", 45),
      innerPaint: null,
    },
  }),
  preset("luxury", {
      // Both stops stay bright: the darker brown this started with fell to 3.5:1
      // against the charcoal plate, which the contrast check rightly rejected.
      dots: { shape: "classy", paint: gradientPaint("#f59e0b", "#fde68a", 120) },
      eyes: {
        linked: true,
        outer: "extra-rounded",
        inner: "diamond",
        outerPaint: solidPaint("#fbbf24"),
        innerPaint: solidPaint("#fde68a"),
      },
      background: { paint: solidPaint("#1c1917"), transparent: false },
      frame: { id: "circle", label: "", labelColor: "#fbbf24", cornerRadius: 1 },
      quietZone: 4,
    },
    "Q",
  ),
];

export const COLOR_PALETTES: ReadonlyArray<{
  id: string;
  nameKey: TranslationKey;
  foreground: string;
  background: string;
}> = [
  { id: "classic", nameKey: "palette.classic", foreground: "#000000", background: "#ffffff" },
  { id: "mono", nameKey: "palette.mono", foreground: "#111827", background: "#f9fafb" },
  { id: "blue", nameKey: "palette.blue", foreground: "#1d4ed8", background: "#ffffff" },
  { id: "purple", nameKey: "palette.purple", foreground: "#6d28d9", background: "#ffffff" },
  { id: "pink", nameKey: "palette.pink", foreground: "#be185d", background: "#fff1f2" },
  { id: "green", nameKey: "palette.green", foreground: "#15803d", background: "#f0fdf4" },
  { id: "orange", nameKey: "palette.orange", foreground: "#c2410c", background: "#fff7ed" },
  { id: "gold", nameKey: "palette.gold", foreground: "#a16207", background: "#fffbeb" },
  { id: "dark", nameKey: "palette.dark", foreground: "#e5e7eb", background: "#0b0f19" },
  { id: "modern", nameKey: "palette.modern", foreground: "#0f172a", background: "#e2e8f0" },
];
