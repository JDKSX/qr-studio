import { sanitiseSvg } from "./sanitizeSvg";

export const ACCEPTED_LOGO_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

/** Anything bigger than this is almost certainly a photo pasted by mistake. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Logos are drawn at a few hundred pixels at most, even in a 4096px export. */
const MAX_DIMENSION = 512;

export interface LoadedLogo {
  /** Always a data URL — remote URLs would taint the export canvas. */
  src: string;
  aspect: number;
  /** Approximate size of the stored data URL, used by the storage manager. */
  bytes: number;
}

/** Reason codes rather than sentences, so the UI can translate the failure. */
export type LoadLogoReason = "too-big" | "bad-svg" | "bad-type" | "read-failed";

export type LoadLogoResult =
  | { ok: true; logo: LoadedLogo }
  | { ok: false; reason: LoadLogoReason; detail?: string };

function isSvg(file: File): boolean {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

/** Chunked so a large SVG cannot blow the argument limit of `String.fromCharCode`. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function readAsText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Raster logos are decoded and redrawn at most `MAX_DIMENSION` wide.
 * Re-encoding here keeps a 12MP phone photo from being carried around in state,
 * in localStorage and into every single preview render.
 */
async function downscaleRaster(file: File): Promise<LoadedLogo> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, width, height);

    // PNG keeps transparency, which most logos rely on.
    const src = canvas.toDataURL("image/png");
    return { src, aspect: width / height, bytes: src.length };
  } finally {
    bitmap.close();
  }
}

export async function loadLogoFile(file: File): Promise<LoadLogoResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: "too-big" };
  }

  try {
    if (isSvg(file)) {
      const sanitised = sanitiseSvg(await readAsText(file));
      if (!sanitised) {
        return { ok: false, reason: "bad-svg" };
      }
      const encoded = `data:image/svg+xml;base64,${toBase64(sanitised.markup)}`;
      return { ok: true, logo: { src: encoded, aspect: sanitised.aspect, bytes: encoded.length } };
    }

    if (!/^image\//.test(file.type)) {
      return { ok: false, reason: "bad-type" };
    }

    return { ok: true, logo: await downscaleRaster(file) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: "read-failed", detail };
  }
}
