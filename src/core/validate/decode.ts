import { rasteriseToImageData } from "../export/raster";

/**
 * Round-trip decoding.
 *
 * The studio renders the code, then reads it back with a real decoder and
 * compares the result with the payload. That is the only honest way to answer
 * "will this still scan?" once a design starts bending the modules.
 *
 * `BarcodeDetector` is used when the browser ships it (Chrome, Edge, Android).
 * Everything else lazily pulls in ZXing compiled to WebAssembly.
 */

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | ImageData | Blob): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

export type DecoderName = "BarcodeDetector" | "ZXing";

export interface DecodeOutcome {
  text: string | null;
  decoder: DecoderName;
}

function nativeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return typeof candidate === "function" ? candidate : null;
}

let nativeSupported: boolean | null = null;

async function supportsNativeQr(): Promise<boolean> {
  if (nativeSupported !== null) return nativeSupported;
  const Detector = nativeDetector();
  if (!Detector) {
    nativeSupported = false;
    return false;
  }
  try {
    const formats = (await Detector.getSupportedFormats?.()) ?? [];
    nativeSupported = formats.includes("qr_code");
  } catch {
    nativeSupported = false;
  }
  return nativeSupported;
}

let zxingReady: Promise<typeof import("zxing-wasm/reader")> | null = null;

/** Loads the wasm decoder once, from our own origin so it works offline too. */
async function loadZXing() {
  if (!zxingReady) {
    zxingReady = (async () => {
      const module = await import("zxing-wasm/reader");
      const wasmUrl = (await import("zxing-wasm/reader/zxing_reader.wasm?url")).default;
      module.prepareZXingModule({
        overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path) },
      });
      return module;
    })();
  }
  return await zxingReady;
}

export async function decodeImageData(image: ImageData): Promise<DecodeOutcome> {
  if (await supportsNativeQr()) {
    const Detector = nativeDetector();
    if (Detector) {
      try {
        const detector = new Detector({ formats: ["qr_code"] });
        const results = await detector.detect(image);
        const first = results[0];
        if (first) return { text: first.rawValue, decoder: "BarcodeDetector" };
        // A miss is a real signal, but fall through to ZXing before reporting it.
      } catch {
        // Some builds reject ImageData; ZXing handles it below.
      }
    }
  }

  const { readBarcodes } = await loadZXing();
  const results = await readBarcodes(image, {
    formats: ["QRCode"],
    tryHarder: true,
    maxNumberOfSymbols: 1,
  });
  const first = results[0];
  return { text: first?.text ?? null, decoder: "ZXing" };
}

export interface RoundTripInput {
  markup: string;
  expected: string;
  /** Pixel size to rasterise at. Large enough to be fair, small enough to be quick. */
  pixels?: number;
  aspect: number;
  background: string;
}

export type RoundTripResult =
  | { status: "match"; decoder: DecoderName }
  | { status: "mismatch"; decoder: DecoderName; text: string }
  | { status: "unreadable"; decoder: DecoderName }
  | { status: "error"; message: string };

export async function roundTripScan({
  markup,
  expected,
  pixels = 512,
  aspect,
  background,
}: RoundTripInput): Promise<RoundTripResult> {
  try {
    const width = aspect >= 1 ? pixels : Math.round(pixels * aspect);
    const height = aspect >= 1 ? Math.round(pixels / aspect) : pixels;
    const image = await rasteriseToImageData(markup, { width, height, background });
    const { text, decoder } = await decodeImageData(image);

    if (text === null) return { status: "unreadable", decoder };
    if (text === expected) return { status: "match", decoder };
    return { status: "mismatch", decoder, text };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
