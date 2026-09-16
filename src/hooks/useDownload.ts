import { useState } from "react";
import { buildExport, downloadBlob, supportsWebp } from "../core/export";
import type { ExportFormat } from "../core/export";
import { useStudio } from "../state/store";
import type { QrPipeline } from "./useQrPipeline";
import { useT } from "./useT";

export interface DownloadController {
  download(format: ExportFormat): void;
  pending: ExportFormat | null;
  ready: boolean;
  webpSupported: boolean;
}

/** Shared by the download panel and the sticky bar on phones. */
export function useDownload(pipeline: QrPipeline): DownloadController {
  const t = useT();
  const exportSize = useStudio((state) => state.exportSize);
  const notify = useStudio((state) => state.notify);
  const recordHistory = useStudio((state) => state.recordHistory);
  const [pending, setPending] = useState<ExportFormat | null>(null);

  const download = (format: ExportFormat) => {
    if (!pipeline.render || pending) return;
    setPending(format);
    void (async () => {
      try {
        const outcome = await buildExport({
          root: pipeline.render!.root,
          format,
          size: exportSize,
          aspect: pipeline.aspect,
          background: pipeline.exportBackground,
          slug: pipeline.slug,
        });
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

  return { download, pending, ready: pipeline.render !== null, webpSupported: supportsWebp() };
}
