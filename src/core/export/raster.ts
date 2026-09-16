import { safeColor } from "../color";

/**
 * Rasterises an SVG string onto a canvas.
 *
 * Both the image exports and the round-trip scan check go through here, so what
 * the validator decodes is pixel-for-pixel what the user downloads.
 */

export interface RasterOptions {
  width: number;
  height: number;
  /** Painted before the SVG. Omit for a transparent PNG/WebP. */
  background?: string | null;
}

async function loadSvgImage(markup: string): Promise<HTMLImageElement> {
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    // Same-origin blob URL with a data: logo inside — the canvas stays untainted.
    image.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The QR image could not be rendered."));
      image.src = url;
    });
    return image;
  } finally {
    // Safari needs the URL alive until after decode, so revoke on the next tick.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function rasteriseToCanvas(
  markup: string,
  { width, height, background }: RasterOptions,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");

  if (background) {
    context.fillStyle = safeColor(background, "#ffffff");
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const image = await loadSvgImage(markup);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function rasteriseToBlob(
  markup: string,
  options: RasterOptions & { type: string; quality?: number },
): Promise<Blob> {
  const canvas = await rasteriseToCanvas(markup, options);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed while encoding the image."))),
      options.type,
      options.quality,
    );
  });
}

export async function rasteriseToImageData(
  markup: string,
  options: RasterOptions,
): Promise<ImageData> {
  const canvas = await rasteriseToCanvas(markup, options);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
