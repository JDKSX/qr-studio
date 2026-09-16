import qrcode from "qrcode-generator";

export type EccLevel = "L" | "M" | "Q" | "H";
export type QrMode = "Numeric" | "Alphanumeric" | "Byte";

export const ECC_LEVELS: ReadonlyArray<EccLevel> = ["L", "M", "Q", "H"];

/** Share of the codewords the format can lose and still decode. */
export const ECC_RECOVERY: Record<EccLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

/**
 * qrcode-generator defaults to a single-byte charset, which mangles every
 * non-ASCII character. The library documents `stringToBytes` as the extension
 * point for this, so we swap in real UTF-8 once at module load.
 */
const utf8 = new TextEncoder();
qrcode.stringToBytes = (value: string): number[] => Array.from(utf8.encode(value));

const NUMERIC = /^[0-9]+$/;
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]+$/;

/** Picking the narrowest legal mode is free capacity. */
export function detectMode(data: string): QrMode {
  if (NUMERIC.test(data)) return "Numeric";
  if (ALPHANUMERIC.test(data)) return "Alphanumeric";
  return "Byte";
}

export interface QRMatrix {
  readonly size: number;
  readonly version: number;
  readonly ecc: EccLevel;
  readonly mode: QrMode;
  readonly data: string;
  /** Safe accessor; out of range reads are `false`. */
  isDark(row: number, col: number): boolean;
  /** True inside one of the three 7x7 finder patterns. */
  isFinder(row: number, col: number): boolean;
}

/**
 * Failures carry a reason code rather than a sentence: the UI owns the wording
 * so that every message can be translated.
 */
export type EncodeResult =
  | { ok: true; matrix: QRMatrix }
  | { ok: false; reason: "empty" | "too-large" | "failed"; detail?: string };

class Matrix implements QRMatrix {
  readonly size: number;
  readonly version: number;
  private readonly bits: Uint8Array;

  constructor(
    bits: Uint8Array,
    size: number,
    readonly ecc: EccLevel,
    readonly mode: QrMode,
    readonly data: string,
  ) {
    this.bits = bits;
    this.size = size;
    this.version = (size - 17) / 4;
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || col < 0 || row >= this.size || col >= this.size) return false;
    return this.bits[row * this.size + col] === 1;
  }

  isFinder(row: number, col: number): boolean {
    const last = this.size - 7;
    const inTopLeft = row < 7 && col < 7;
    const inTopRight = row < 7 && col >= last;
    const inBottomLeft = row >= last && col < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  }
}

const CACHE_LIMIT = 12;
const cache = new Map<string, EncodeResult>();

function remember(key: string, value: EncodeResult): EncodeResult {
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return value;
}

/**
 * Encodes `data` with a real QR engine and returns the raw module matrix.
 * Never throws — an over-long payload comes back as `{ ok: false }` so the UI
 * can warn instead of crashing.
 */
export function encodeMatrix(data: string, ecc: EccLevel): EncodeResult {
  if (!data) {
    return { ok: false, reason: "empty" };
  }

  const key = `${ecc}::${data}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const mode = detectMode(data);
  try {
    // typeNumber 0 lets the engine pick the smallest version that fits.
    const qr = qrcode(0, ecc);
    qr.addData(data, mode);
    qr.make();

    const size = qr.getModuleCount();
    const bits = new Uint8Array(size * size);
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        bits[row * size + col] = qr.isDark(row, col) ? 1 : 0;
      }
    }
    return remember(key, { ok: true, matrix: new Matrix(bits, size, ecc, mode, data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/over capacity|too long|code length|big/i.test(message)) {
      return remember(key, { ok: false, reason: "too-large" });
    }
    return remember(key, { ok: false, reason: "failed", detail: message });
  }
}
