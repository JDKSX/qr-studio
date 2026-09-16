import { serialiseSvg } from "../render/serialize";
import type { SvgNode } from "../render/types";
import { buildFilename } from "./filename";
import { rasteriseToBlob } from "./raster";

export type ExportFormat = "png" | "jpg" | "webp" | "svg";

export const SIZE_PRESETS = [512, 1024, 2048, 4096] as const;

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  svg: "SVG",
  jpg: "JPG",
  webp: "WebP",
};

const MIME: Record<Exclude<ExportFormat, "svg">, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

let webpSupport: boolean | null = null;

/** Safari only gained canvas WebP encoding in 14; older builds silently fall back to PNG. */
export function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

export interface ExportRequest {
  root: SvgNode;
  format: ExportFormat;
  /** Longest edge in pixels. Ignored for SVG, which stays resolution independent. */
  size: number;
  aspect: number;
  /** Background colour painted under the code; `null` keeps PNG/WebP transparent. */
  background: string | null;
  /** Used to build the filename. */
  slug: string;
}

export interface ExportOutcome {
  blob: Blob;
  filename: string;
}

function dimensions(size: number, aspect: number): { width: number; height: number } {
  return aspect >= 1
    ? { width: Math.round(size), height: Math.round(size / aspect) }
    : { width: Math.round(size * aspect), height: Math.round(size) };
}

export async function buildExport(request: ExportRequest): Promise<ExportOutcome> {
  const { root, format, size, aspect, background, slug } = request;
  const { width, height } = dimensions(size, aspect);

  if (format === "svg") {
    // A true vector file: geometry only, no rasterised copy embedded.
    const markup = serialiseSvg(root, { width, height, standalone: true });
    return {
      blob: new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
      filename: buildFilename(slug, "svg"),
    };
  }

  const markup = serialiseSvg(root, { width, height });
  const effectiveFormat = format === "webp" && !supportsWebp() ? "png" : format;
  // JPG has no alpha channel: without an explicit plate it renders solid black.
  const plate = effectiveFormat === "jpg" ? (background ?? "#ffffff") : background;

  const blob = await rasteriseToBlob(markup, {
    width,
    height,
    background: plate,
    type: MIME[effectiveFormat],
    quality: effectiveFormat === "png" ? undefined : 0.95,
  });

  return { blob, filename: buildFilename(slug, effectiveFormat) };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
