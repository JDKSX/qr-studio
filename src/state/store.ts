import { create } from "zustand";
import { CONTENT_SCHEMAS } from "../core/encode/contentSchemas";
import type { Lang } from "../i18n";
import type { EccLevel } from "../core/encode/qrEngine";
import type { ContentTypeId, ContentValues } from "../core/encode/types";
import { COLOR_PALETTES, DEFAULT_DESIGN, DEFAULT_ECC, DESIGN_PRESETS, cloneDesign } from "../core/presets/design";
import { randomDesign } from "../core/presets/randomize";
import { solidPaint } from "../core/render/paint";
import type {
  DesignSpec,
  DotShapeId,
  EyeInnerId,
  EyeOuterId,
  FrameId,
  LogoSpec,
  Paint,
} from "../core/render/types";
import type { HistoryEntry, SavedDesign } from "../core/storage/storage";
import {
  STORAGE_KEYS,
  loadDesigns,
  loadHistory,
  loadSession,
  newId,
  readJson,
  saveDesigns,
  saveHistory,
  saveSession,
  writeJson,
} from "../core/storage/storage";
import type { FixAction } from "../core/validate";
import { DEFAULT_EXPORT_SIZE, SAMPLE_CONTENT_TYPE, initialValues } from "./defaults";

export type ThemeChoice = "light" | "dark" | "system";

/**
 * "simple" is a guided three-step flow; "advanced" opens every control.
 * The default is simple — most people want a code, not a design tool.
 */
export type StudioMode = "simple" | "advanced";
export type PaintTarget = "dots" | "eyeOuter" | "eyeInner" | "background";

export interface Toast {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
}

export interface StudioState {
  contentType: ContentTypeId;
  values: Record<ContentTypeId, ContentValues>;
  design: DesignSpec;
  ecc: EccLevel;
  exportSize: number;
  theme: ThemeChoice;
  lang: Lang;
  mode: StudioMode;
  savedDesigns: SavedDesign[];
  history: HistoryEntry[];
  toast: Toast | null;

  setContentType(type: ContentTypeId): void;
  setField(name: string, value: string): void;
  resetContent(): void;

  setDotShape(shape: DotShapeId): void;
  setEyeShape(part: "outer" | "inner", shape: EyeOuterId | EyeInnerId): void;
  setEyeLinked(linked: boolean): void;
  setPaint(target: PaintTarget, paint: Paint | null): void;
  setBackgroundTransparent(transparent: boolean): void;
  setQuietZone(modules: number): void;
  setEcc(ecc: EccLevel): void;
  setFrame(patch: Partial<DesignSpec["frame"]> & { id?: FrameId }): void;
  setExportSize(size: number): void;

  setLogo(logo: LogoSpec | null): void;
  updateLogo(patch: Partial<LogoSpec>): void;

  applyPreset(id: string): void;
  applyPalette(id: string): void;
  randomise(): void;
  resetDesign(): void;
  applyFix(action: FixAction): void;

  saveCurrentDesign(name: string, fallbackName: string): void;
  deleteSavedDesign(id: string): void;
  applySavedDesign(id: string): void;

  recordHistory(label: string): void;
  applyHistoryEntry(id: string): void;
  clearHistory(): void;

  setTheme(theme: ThemeChoice): void;
  setLang(lang: Lang): void;
  setMode(mode: StudioMode): void;
  notify(message: string, tone?: Toast["tone"]): void;
  dismissToast(): void;
}

/** Restores the previous session, falling back to the sample URL on a first visit. */
function bootstrap(): Pick<
  StudioState,
  | "contentType"
  | "values"
  | "design"
  | "ecc"
  | "exportSize"
  | "theme"
  | "lang"
  | "mode"
  | "savedDesigns"
  | "history"
> {
  const session = loadSession();
  const base = initialValues();

  return {
    contentType: session?.contentType ?? SAMPLE_CONTENT_TYPE,
    values: session?.values ? { ...base, ...session.values } : base,
    design: session?.design ? { ...cloneDesign(DEFAULT_DESIGN), ...session.design } : cloneDesign(DEFAULT_DESIGN),
    ecc: session?.ecc ?? DEFAULT_ECC,
    exportSize: session?.exportSize ?? DEFAULT_EXPORT_SIZE,
    theme: readJson<ThemeChoice>(STORAGE_KEYS.theme, "system"),
    lang: readJson<Lang>(STORAGE_KEYS.lang, "th"),
    mode: readJson<StudioMode>(STORAGE_KEYS.mode, "simple"),
    savedDesigns: loadDesigns(),
    history: loadHistory(),
  };
}

export const useStudio = create<StudioState>()((set, get) => ({
  ...bootstrap(),
  toast: null,

  setContentType: (contentType) => set({ contentType }),

  setField: (name, value) =>
    set((state) => ({
      values: {
        ...state.values,
        [state.contentType]: { ...state.values[state.contentType], [name]: value },
      },
    })),

  resetContent: () =>
    set((state) => ({
      values: {
        ...state.values,
        [state.contentType]: { ...CONTENT_SCHEMAS[state.contentType].defaults },
      },
    })),

  setDotShape: (shape) =>
    set((state) => ({ design: { ...state.design, dots: { ...state.design.dots, shape } } })),

  setEyeShape: (part, shape) =>
    set((state) => ({
      design: {
        ...state.design,
        eyes:
          part === "outer"
            ? { ...state.design.eyes, outer: shape as EyeOuterId }
            : { ...state.design.eyes, inner: shape as EyeInnerId },
      },
    })),

  setEyeLinked: (linked) =>
    set((state) => ({ design: { ...state.design, eyes: { ...state.design.eyes, linked } } })),

  setPaint: (target, paint) =>
    set((state) => {
      const design = { ...state.design };
      if (target === "dots" && paint) design.dots = { ...design.dots, paint };
      if (target === "eyeOuter") design.eyes = { ...design.eyes, outerPaint: paint };
      if (target === "eyeInner") design.eyes = { ...design.eyes, innerPaint: paint };
      if (target === "background" && paint) design.background = { ...design.background, paint };
      return { design };
    }),

  setBackgroundTransparent: (transparent) =>
    set((state) => ({
      design: { ...state.design, background: { ...state.design.background, transparent } },
    })),

  setQuietZone: (modules) =>
    set((state) => ({ design: { ...state.design, quietZone: Math.max(0, Math.min(12, Math.round(modules))) } })),

  setEcc: (ecc) => set({ ecc }),

  setFrame: (patch) => set((state) => ({ design: { ...state.design, frame: { ...state.design.frame, ...patch } } })),

  setExportSize: (exportSize) => set({ exportSize: Math.max(64, Math.min(8192, Math.round(exportSize))) }),

  setLogo: (logo) =>
    set((state) => ({
      design: { ...state.design, logo },
      // A logo always wants the highest recovery level available.
      ecc: logo ? "H" : state.ecc,
    })),

  updateLogo: (patch) =>
    set((state) => (state.design.logo ? { design: { ...state.design, logo: { ...state.design.logo, ...patch } } } : {})),

  applyPreset: (id) => {
    const preset = DESIGN_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    set((state) => ({
      design: { ...cloneDesign({ ...preset.design, logo: null }), logo: state.design.logo },
      ecc: state.design.logo ? "H" : (preset.ecc ?? state.ecc),
    }));
  },

  applyPalette: (id) => {
    const palette = COLOR_PALETTES.find((item) => item.id === id);
    if (!palette) return;
    set((state) => ({
      design: {
        ...state.design,
        dots: { ...state.design.dots, paint: solidPaint(palette.foreground) },
        eyes: { ...state.design.eyes, outerPaint: null, innerPaint: null },
        background: { ...state.design.background, paint: solidPaint(palette.background) },
        frame: { ...state.design.frame, labelColor: palette.foreground },
      },
    }));
  },

  randomise: () => set((state) => ({ design: randomDesign(state.design) })),

  resetDesign: () =>
    set((state) => ({ design: { ...cloneDesign(DEFAULT_DESIGN), logo: state.design.logo }, ecc: state.design.logo ? "H" : DEFAULT_ECC })),

  applyFix: (action) => {
    const state = get();
    switch (action.kind) {
      case "ecc":
        state.setEcc(action.value);
        break;
      case "quietZone":
        state.setQuietZone(action.value);
        break;
      case "logoSize":
        state.updateLogo({ size: action.value });
        break;
      case "logoPosition":
        state.updateLogo({ position: action.value });
        break;
      case "removeLogo":
        state.setLogo(null);
        break;
      case "colors":
        set((current) => ({
          design: {
            ...current.design,
            dots: { ...current.design.dots, paint: solidPaint(action.foreground) },
            eyes: { ...current.design.eyes, outerPaint: null, innerPaint: null },
            background: { ...current.design.background, paint: solidPaint(action.background), transparent: false },
          },
        }));
        break;
      case "swapColors":
        set((current) => {
          const foreground = current.design.dots.paint;
          const background = current.design.background.paint;
          return {
            design: {
              ...current.design,
              dots: { ...current.design.dots, paint: background },
              eyes: { ...current.design.eyes, outerPaint: null, innerPaint: null },
              background: { ...current.design.background, paint: foreground, transparent: false },
            },
          };
        });
        break;
      case "dotShape":
        state.setDotShape(action.value);
        break;
      case "exportSize":
        state.setExportSize(action.value);
        break;
    }
  },

  saveCurrentDesign: (name, fallbackName) => {
    const { design, ecc, savedDesigns } = get();
    const entry: SavedDesign = {
      id: newId(),
      name: name.trim() || fallbackName,
      design,
      ecc,
      createdAt: Date.now(),
    };
    const next = [entry, ...savedDesigns];
    saveDesigns(next);
    set({ savedDesigns: next });
  },

  deleteSavedDesign: (id) => {
    const next = get().savedDesigns.filter((item) => item.id !== id);
    saveDesigns(next);
    set({ savedDesigns: next });
  },

  applySavedDesign: (id) => {
    const entry = get().savedDesigns.find((item) => item.id === id);
    if (!entry) return;
    set((state) => ({ design: { ...cloneDesign(entry.design), logo: entry.design.logo ?? state.design.logo }, ecc: entry.ecc }));
  },

  recordHistory: (label) => {
    const { contentType, values, design, ecc, history } = get();
    const entry: HistoryEntry = {
      id: newId(),
      label,
      contentType,
      values: { ...values[contentType] },
      design,
      ecc,
      createdAt: Date.now(),
    };
    // Replace an identical previous entry rather than stacking duplicates.
    const deduped = history.filter(
      (item) => !(item.contentType === entry.contentType && item.label === entry.label),
    );
    const next = [entry, ...deduped];
    saveHistory(next);
    set({ history: next.slice(0, 12) });
  },

  applyHistoryEntry: (id) => {
    const entry = get().history.find((item) => item.id === id);
    if (!entry) return;
    set((state) => ({
      contentType: entry.contentType,
      values: { ...state.values, [entry.contentType]: { ...entry.values } },
      design: cloneDesign(entry.design),
      ecc: entry.ecc,
    }));
  },

  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  setTheme: (theme) => {
    writeJson(STORAGE_KEYS.theme, theme);
    set({ theme });
  },

  setLang: (lang) => {
    writeJson(STORAGE_KEYS.lang, lang);
    document.documentElement.lang = lang;
    set({ lang });
  },

  setMode: (mode) => {
    writeJson(STORAGE_KEYS.mode, mode);
    set({ mode });
  },

  notify: (message, tone = "info") => set({ toast: { id: newId(), message, tone } }),
  dismissToast: () => set({ toast: null }),
}));

/* ------------------------------------------------------------------ *
 * Session persistence
 *
 * Debounced so dragging a colour slider does not hit localStorage on
 * every animation frame.
 * ------------------------------------------------------------------ */
let persistTimer: ReturnType<typeof setTimeout> | undefined;

useStudio.subscribe((state) => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveSession({
      contentType: state.contentType,
      values: state.values,
      design: state.design,
      ecc: state.ecc,
      exportSize: state.exportSize,
    });
  }, 400);
});
