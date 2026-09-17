import { useState } from "react";
import { buildExport, downloadBlob } from "../core/export";
import type { ExportFormat } from "../core/export";
import { supportsWebp } from "../core/export";
import { useStudio } from "../state/store";
import type { QrPipeline } from "./useQrPipeline";
import { useT } from "./useT";

export type CopyState = "idle" | "working" | "copied";

export interface DownloadController {
  download(format: ExportFormat): void;
  /** Puts the QR on the clipboard as a PNG, ready to paste anywhere. */
  copy(): void;
  pending: ExportFormat | null;
  copyState: CopyState;
  copySupported: boolean;
  ready: boolean;
  webpSupported: boolean;
}

/** Writing an image to the clipboard needs both APIs, and Firefox only got them recently. */
function clipboardImagesSupported(): boolean {
  return typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
}

export function useDownload(pipeline: QrPipeline): DownloadController {
  const t = useT();
  const exportSize = useStudio((state) => state.exportSize);
  const notify = useStudio((state) => state.notify);
  const recordHistory = useStudio((state) => state.recordHistory);
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const build = (format: ExportFormat) =>
    buildExport({
      root: pipeline.render!.root,
      format,
      size: exportSize,
      aspect: pipeline.aspect,
      background: pipeline.exportBackground,
      slug: pipeline.slug,
    });

  const download = (format: ExportFormat) => {
    if (!pipeline.render || pending) return;
    setPending(format);
    void (async () => {
      try {
        const outcome = await build(format);
        downloadBlob(outcome.blob, outcome.filename);
        recordHistory(pipeline.label);
        notify(t("export.saved", { filename: outcome.filename }), "success");
      } catch (error) {
        notify(error instanceof Error ? error.message : t("export.failed"), "error");
      } finally {
        setPending(null);
      }
    })();
  };

  const copy = () => {
    if (!pipeline.render || copyState === "working") return;
    if (!clipboardImagesSupported()) {
      notify(t("download.copyUnsupported"), "error");
      return;
    }

    setCopyState("working");
    void (async () => {
      try {
        // Safari clears the user-gesture flag across an await, so the blob is
        // handed over as a promise and resolved by the clipboard itself.
        const blobPromise = build("png").then((outcome) => outcome.blob);
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
        } catch {
          // Older builds reject a promise value; retry with the resolved blob.
          await navigator.clipboard.write([new ClipboardItem({ "image/png": await blobPromise })]);
        }
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2000);
      } catch {
        setCopyState("idle");
        notify(t("download.copyFailed"), "error");
      }
    })();
  };

  return {
    download,
    copy,
    pending,
    copyState,
    copySupported: clipboardImagesSupported(),
    ready: pipeline.render !== null,
    webpSupported: supportsWebp(),
  };
}
