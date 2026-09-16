import type { EccLevel } from "../encode/qrEngine";
import type { ContentTypeId, ContentValues } from "../encode/types";
import type { DesignSpec } from "../render/types";

/**
 * Everything the studio remembers lives in this browser only.
 * There is no server, no sync and no analytics — see the privacy note in the UI.
 *
 * Every read and write is guarded: private windows, disabled site data and full
 * quotas all throw here, and none of them should break the app.
 */

const VERSION = "v1";
const key = (name: string) => `jdks-qr:${VERSION}:${name}`;

export const STORAGE_KEYS = {
  session: key("session"),
  designs: key("designs"),
  history: key("history"),
  theme: key("theme"),
  lang: key("lang"),
  mode: key("mode"),
} as const;

/** A logo bigger than this is kept in memory only, so one upload cannot fill the quota. */
const MAX_PERSISTED_LOGO_BYTES = 200_000;

export function readJson<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(storageKey: string, value: unknown): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* nothing we can do, and nothing that should break the app */
  }
}

/** Drops an oversized logo before persisting, keeping the rest of the design. */
export function persistableDesign(design: DesignSpec): DesignSpec {
  if (design.logo && design.logo.src.length > MAX_PERSISTED_LOGO_BYTES) {
    return { ...design, logo: null };
  }
  return design;
}

export interface SessionSnapshot {
  contentType: ContentTypeId;
  values: Record<string, ContentValues>;
  design: DesignSpec;
  ecc: EccLevel;
  exportSize: number;
}

export interface SavedDesign {
  id: string;
  name: string;
  design: DesignSpec;
  ecc: EccLevel;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  label: string;
  contentType: ContentTypeId;
  values: ContentValues;
  design: DesignSpec;
  ecc: EccLevel;
  createdAt: number;
}

const HISTORY_LIMIT = 12;
const DESIGN_LIMIT = 24;

export function loadSession(): SessionSnapshot | null {
  return readJson<SessionSnapshot | null>(STORAGE_KEYS.session, null);
}

export function saveSession(snapshot: SessionSnapshot): void {
  writeJson(STORAGE_KEYS.session, { ...snapshot, design: persistableDesign(snapshot.design) });
}

export function loadDesigns(): SavedDesign[] {
  return readJson<SavedDesign[]>(STORAGE_KEYS.designs, []);
}

export function saveDesigns(designs: ReadonlyArray<SavedDesign>): void {
  writeJson(STORAGE_KEYS.designs, designs.slice(0, DESIGN_LIMIT));
}

export function loadHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(STORAGE_KEYS.history, []);
}

export function saveHistory(entries: ReadonlyArray<HistoryEntry>): void {
  writeJson(
    STORAGE_KEYS.history,
    entries.slice(0, HISTORY_LIMIT).map((entry) => ({ ...entry, design: persistableDesign(entry.design) })),
  );
}

export function clearAll(): void {
  for (const storageKey of Object.values(STORAGE_KEYS)) removeKey(storageKey);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
