import type { Translate } from "../../i18n";
import { contrastRatio, luminance, safeColor } from "../color";
import type { EccLevel, QRMatrix } from "../encode/qrEngine";
import { ECC_RECOVERY } from "../encode/qrEngine";
import { getDotShape } from "../render/dots";
import { paintSamples } from "../render/renderer";
import type { DesignSpec, DotShapeId, LogoPosition, RenderResult } from "../render/types";

export type CheckLevel = "ok" | "info" | "warn" | "error" | "pending";

/** A one-click remedy the UI can apply to the store. */
export type FixAction =
  | { kind: "ecc"; value: EccLevel }
  | { kind: "quietZone"; value: number }
  | { kind: "logoSize"; value: number }
  | { kind: "logoPosition"; value: LogoPosition }
  | { kind: "removeLogo" }
  | { kind: "colors"; foreground: string; background: string }
  | { kind: "swapColors" }
  | { kind: "dotShape"; value: DotShapeId }
  | { kind: "exportSize"; value: number };

export interface Check {
  id: string;
  level: CheckLevel;
  title: string;
  detail?: string;
  fix?: { label: string; action: FixAction };
}

export interface ValidationReport {
  checks: Check[];
  worst: CheckLevel;
  /** True when nothing is worse than a warning. */
  usable: boolean;
}

const SEVERITY: Record<CheckLevel, number> = { ok: 0, info: 0, pending: 1, warn: 2, error: 3 };

export function worstLevel(checks: ReadonlyArray<Check>): CheckLevel {
  return checks.reduce<CheckLevel>(
    (worst, check) => (SEVERITY[check.level] > SEVERITY[worst] ? check.level : worst),
    "ok",
  );
}

export interface StaticCheckInput {
  matrix: QRMatrix;
  design: DesignSpec;
  render: RenderResult;
  /** Longest edge of the planned export, in pixels. */
  exportSize: number;
  /** Injected so this stays a pure function with no React or i18n runtime. */
  t: Translate;
}

function overlapsFinder(
  rect: { x: number; y: number; width: number; height: number },
  modules: number,
): boolean {
  const finders = [
    { x: 0, y: 0 },
    { x: modules - 7, y: 0 },
    { x: 0, y: modules - 7 },
  ];
  return finders.some(
    (finder) =>
      rect.x < finder.x + 7 &&
      rect.x + rect.width > finder.x &&
      rect.y < finder.y + 7 &&
      rect.y + rect.height > finder.y,
  );
}

/**
 * Cheap, synchronous checks. These run on every keystroke; the expensive
 * round-trip decode is merged in separately once it settles.
 */
export function runStaticChecks({ matrix, design, render, exportSize, t }: StaticCheckInput): Check[] {
  const checks: Check[] = [];

  checks.push({
    id: "generated",
    level: "ok",
    title: t("check.generated"),
    detail: t("check.generated.detail", {
      version: matrix.version,
      size: matrix.size,
      mode: matrix.mode,
    }),
  });

  /* ---------------- contrast ---------------- */
  const { foreground, background } = paintSamples(design);
  const assumedBackground = design.background.transparent ? ["#ffffff"] : background;
  let minContrast = Number.POSITIVE_INFINITY;
  for (const fg of foreground) {
    for (const bg of assumedBackground) {
      minContrast = Math.min(minContrast, contrastRatio(fg, bg));
    }
  }
  const ratio = minContrast.toFixed(1);

  const averageForeground =
    foreground.reduce((sum, hex) => sum + luminance(hex), 0) / foreground.length;
  const averageBackground =
    assumedBackground.reduce((sum, hex) => sum + luminance(hex), 0) / assumedBackground.length;

  if (minContrast < 3) {
    checks.push({
      id: "contrast",
      level: "error",
      title: t("check.contrast.error"),
      detail: t("check.contrast.error.detail", { ratio }),
      fix: {
        label: t("check.contrast.fixBlackWhite"),
        action: { kind: "colors", foreground: "#000000", background: "#ffffff" },
      },
    });
  } else if (minContrast < 7) {
    checks.push({
      id: "contrast",
      level: "warn",
      title: t("check.contrast.warn"),
      detail: t("check.contrast.warn.detail", { ratio }),
      fix: {
        label: t("check.contrast.fixDarken"),
        action: {
          kind: "colors",
          foreground: "#111827",
          background: safeColor(assumedBackground[0], "#ffffff"),
        },
      },
    });
  } else {
    checks.push({
      id: "contrast",
      level: "ok",
      title: t("check.contrast.ok"),
      detail: t("check.contrast.ok.detail", { ratio }),
    });
  }

  if (averageForeground > averageBackground) {
    checks.push({
      id: "inverted",
      level: "warn",
      title: t("check.inverted"),
      detail: t("check.inverted.detail"),
      fix: { label: t("check.inverted.fix"), action: { kind: "swapColors" } },
    });
  }

  /* ---------------- quiet zone ---------------- */
  if (design.quietZone < 1) {
    checks.push({
      id: "quiet-zone",
      level: "error",
      title: t("check.quiet.error"),
      detail: t("check.quiet.error.detail"),
      fix: { label: t("check.quiet.fix"), action: { kind: "quietZone", value: 4 } },
    });
  } else if (design.quietZone < 4) {
    checks.push({
      id: "quiet-zone",
      level: "warn",
      title: t("check.quiet.warn"),
      detail: t("check.quiet.warn.detail", { n: design.quietZone }),
      fix: { label: t("check.quiet.fix"), action: { kind: "quietZone", value: 4 } },
    });
  } else {
    checks.push({
      id: "quiet-zone",
      level: "ok",
      title: t("check.quiet.ok"),
      detail: t("check.quiet.ok.detail", { n: design.quietZone }),
    });
  }

  /* ---------------- error correction ---------------- */
  const recovery = Math.round(ECC_RECOVERY[matrix.ecc] * 100);
  if (design.logo && matrix.ecc !== "H") {
    checks.push({
      id: "ecc",
      level: "warn",
      title: t("check.ecc.warn"),
      detail: t("check.ecc.warn.detail", { level: matrix.ecc, percent: recovery }),
      fix: { label: t("check.ecc.fix"), action: { kind: "ecc", value: "H" } },
    });
  } else {
    checks.push({
      id: "ecc",
      level: "ok",
      title: t("check.ecc.ok", { level: matrix.ecc }),
      detail: t("check.ecc.ok.detail", { percent: recovery }),
    });
  }

  /* ---------------- logo ---------------- */
  if (design.logo && render.geometry.logoRect) {
    const padded = {
      x: render.geometry.logoRect.x - design.logo.padding,
      y: render.geometry.logoRect.y - design.logo.padding,
      width: render.geometry.logoRect.width + design.logo.padding * 2,
      height: render.geometry.logoRect.height + design.logo.padding * 2,
    };

    if (overlapsFinder(padded, matrix.size)) {
      checks.push({
        id: "logo-finder",
        level: "error",
        title: t("check.logoFinder"),
        detail: t("check.logoFinder.detail"),
        fix: { label: t("check.logoFinder.fix"), action: { kind: "logoPosition", value: "center" } },
      });
    }

    const coveredRatio = render.obscuredModules / (matrix.size * matrix.size);
    // The published recovery rates are per codeword; one solid block in the
    // middle of a code is harsher than that number suggests. Sweeping real
    // decodes across versions 2-14 put the practical ceiling near half of the
    // nominal budget, so that is what we spend. The round-trip decode below
    // remains the final authority.
    const budget = ECC_RECOVERY[matrix.ecc] * 0.45;
    const covered = (coveredRatio * 100).toFixed(1);

    if (coveredRatio > budget) {
      checks.push({
        id: "logo-size",
        level: "error",
        title: t("check.logoSize.error"),
        detail: t("check.logoSize.error.detail", {
          covered,
          level: matrix.ecc,
          budget: (budget * 100).toFixed(0),
        }),
        fix: { label: t("check.logoSize.fixShrink"), action: { kind: "logoSize", value: 0.18 } },
      });
    } else if (coveredRatio > budget * 0.75) {
      checks.push({
        id: "logo-size",
        level: "warn",
        title: t("check.logoSize.warn"),
        detail: t("check.logoSize.warn.detail", { covered }),
        fix: {
          label: t("check.logoSize.fixShrinkABit"),
          action: { kind: "logoSize", value: Math.max(0.12, design.logo.size - 0.05) },
        },
      });
    } else {
      checks.push({
        id: "logo-size",
        level: "ok",
        title: t("check.logoSize.ok"),
        detail: t("check.logoSize.ok.detail", { covered, level: matrix.ecc }),
      });
    }
  }

  /* ---------------- module size at export ---------------- */
  const modulePixels = exportSize / render.geometry.viewWidth;
  if (modulePixels < 3) {
    checks.push({
      id: "module-size",
      level: "warn",
      title: t("check.moduleSize.warn"),
      detail: t("check.moduleSize.warn.detail", { pixels: modulePixels.toFixed(1) }),
      fix: { label: t("check.moduleSize.fix"), action: { kind: "exportSize", value: 1024 } },
    });
  }

  /* ---------------- experimental shapes ---------------- */
  const shape = getDotShape(design.dots.shape);
  if (shape.experimental) {
    checks.push({
      id: "shape",
      level: "warn",
      title: t("check.shape.warn", { shape: t(shape.labelKey) }),
      detail: t("check.shape.warn.detail"),
      fix: { label: t("check.shape.fix"), action: { kind: "dotShape", value: "rounded" } },
    });
  }

  return checks;
}

/** Merges the async round-trip result into the synchronous checks. */
export function buildReport(staticChecks: Check[], scanCheck: Check | null): ValidationReport {
  const checks = scanCheck ? [...staticChecks, scanCheck] : staticChecks;
  const worst = worstLevel(checks);
  return { checks, worst, usable: SEVERITY[worst] < SEVERITY.error };
}
