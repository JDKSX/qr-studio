import { useEffect, useMemo, useRef, useState } from "react";
import { safeColor } from "../core/color";
import { buildPayload, getSchema, missingRequired } from "../core/encode/contentSchemas";
import { encodeMatrix } from "../core/encode/qrEngine";
import type { EncodeResult } from "../core/encode/qrEngine";
import { renderQR } from "../core/render/renderer";
import { serialiseSvg } from "../core/render/serialize";
import type { RenderResult } from "../core/render/types";
import { buildReport, runStaticChecks } from "../core/validate";
import type { Check, ValidationReport } from "../core/validate";
import { roundTripScan } from "../core/validate/decode";
import type { TranslationKey } from "../i18n";
import { useStudio } from "../state/store";
import { useT } from "./useT";

export interface QrPipeline {
  payload: string;
  encoded: EncodeResult;
  render: RenderResult | null;
  report: ValidationReport;
  /** Filename fragment for downloads. */
  slug: string;
  /** Human label used by the history list. */
  label: string;
  /** Translation keys of the required fields that are still empty. */
  missing: TranslationKey[];
  /** Background used when rasterising; `null` when the user asked for transparency. */
  exportBackground: string | null;
  aspect: number;
}

/**
 * The single data flow of the studio:
 *   form values -> payload -> matrix -> SVG tree -> checks
 *
 * Each stage is memoised on its own inputs, so changing a colour re-renders the
 * SVG without re-encoding, and typing re-encodes without rebuilding the design.
 */
export function useQrPipeline(): QrPipeline {
  const t = useT();
  const contentType = useStudio((state) => state.contentType);
  const values = useStudio((state) => state.values[state.contentType]);
  const design = useStudio((state) => state.design);
  const ecc = useStudio((state) => state.ecc);
  const exportSize = useStudio((state) => state.exportSize);

  const schema = getSchema(contentType);
  const typeLabel = t(schema.labelKey);
  const payload = useMemo(() => buildPayload(contentType, values ?? {}), [contentType, values]);
  const missing = useMemo(() => missingRequired(contentType, values ?? {}), [contentType, values]);

  const encoded = useMemo(() => encodeMatrix(payload, ecc), [payload, ecc]);

  const render = useMemo(() => {
    if (!encoded.ok) return null;
    return renderQR(encoded.matrix, design, { title: `${typeLabel} QR Code` });
  }, [encoded, design, typeLabel]);

  const staticChecks = useMemo(() => {
    if (!encoded.ok || !render) return [];
    return runStaticChecks({ matrix: encoded.matrix, design, render, exportSize, t });
  }, [encoded, render, design, exportSize, t]);

  const exportBackground = design.background.transparent
    ? null
    : safeColor(
        design.background.paint.mode === "gradient"
          ? design.background.paint.gradient.from
          : design.background.paint.color,
        "#ffffff",
      );

  const aspect = render ? render.geometry.viewWidth / render.geometry.viewHeight : 1;

  /* ---- asynchronous round-trip decode ---- */
  const [scan, setScan] = useState<
    | { state: "idle" }
    | { state: "pending" }
    | { state: "ok"; decoder: string }
    | { state: "unreadable" }
    | { state: "mismatch" }
    | { state: "unavailable"; detail: string }
  >({ state: "idle" });
  const runId = useRef(0);

  const markup = useMemo(
    () => (render ? serialiseSvg(render.root, { width: 512, height: Math.round(512 / aspect) }) : ""),
    [render, aspect],
  );

  useEffect(() => {
    if (!markup) {
      setScan({ state: "idle" });
      return;
    }

    const id = runId.current + 1;
    runId.current = id;
    setScan({ state: "pending" });

    const timer = setTimeout(() => {
      void roundTripScan({
        markup,
        expected: payload,
        aspect,
        background: exportBackground ?? "#ffffff",
      }).then((result) => {
        if (runId.current !== id) return;
        if (result.status === "match") setScan({ state: "ok", decoder: result.decoder });
        else if (result.status === "unreadable") setScan({ state: "unreadable" });
        else if (result.status === "mismatch") setScan({ state: "mismatch" });
        else setScan({ state: "unavailable", detail: result.message });
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [markup, payload, aspect, exportBackground]);

  // Kept out of the effect so a language switch re-labels the result instantly.
  const scanCheck = useMemo<Check | null>(() => {
    switch (scan.state) {
      case "idle":
        return null;
      case "pending":
        return { id: "scan", level: "pending", title: t("check.scan.pending") };
      case "ok":
        return {
          id: "scan",
          level: "ok",
          title: t("check.scan.ok"),
          detail: t("check.scan.ok.detail", { decoder: scan.decoder }),
        };
      case "unreadable":
        return {
          id: "scan",
          level: "error",
          title: t("check.scan.unreadable"),
          detail: t("check.scan.unreadable.detail"),
        };
      case "mismatch":
        return {
          id: "scan",
          level: "error",
          title: t("check.scan.mismatch"),
          detail: t("check.scan.mismatch.detail"),
        };
      case "unavailable":
        return { id: "scan", level: "info", title: t("check.scan.unavailable"), detail: scan.detail };
    }
  }, [scan, t]);

  const report = useMemo(() => buildReport(staticChecks, scanCheck), [staticChecks, scanCheck]);

  return {
    payload,
    encoded,
    render,
    report,
    slug: schema.slug(values ?? {}),
    label: schema.slug(values ?? {}) || typeLabel,
    missing,
    exportBackground,
    aspect,
  };
}
