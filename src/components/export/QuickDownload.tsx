import { FORMAT_LABELS } from "../../core/export";
import type { ExportFormat } from "../../core/export";
import { useDownload } from "../../hooks/useDownload";
import type { QrPipeline } from "../../hooks/useQrPipeline";
import { useT } from "../../hooks/useT";
import { Button } from "../ui/controls";

const SECONDARY: ReadonlyArray<ExportFormat> = ["svg", "jpg", "webp"];

/**
 * The download control that sits directly under the preview.
 *
 * One obvious button does the thing almost everyone wants — a high resolution
 * PNG — and the other formats stay one click away without competing for
 * attention.
 */
export function QuickDownload({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const { download, pending, ready, webpSupported } = useDownload(pipeline);

  return (
    <div className="quick-download">
      <Button variant="primary" size="lg" disabled={!ready || pending !== null} onClick={() => download("png")}>
        {pending === "png" ? t("download.working") : t("download.primary")}
      </Button>

      <div className="quick-download__secondary">
        <span className="quick-download__label">{t("download.other")}</span>
        {SECONDARY.map((format) => (
          <button
            key={format}
            type="button"
            className="link-button"
            disabled={!ready || pending !== null || (format === "webp" && !webpSupported)}
            onClick={() => download(format)}
          >
            {pending === format ? "…" : FORMAT_LABELS[format]}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * On a phone the preview scrolls away as soon as you start typing, taking the
 * download button with it. This bar keeps the way out on screen; it is hidden
 * on wider layouts where the preview column is always visible.
 */
export function MobileDownloadBar({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const { download, pending, ready } = useDownload(pipeline);

  if (!ready) return null;

  return (
    <div className="mobile-download">
      <Button variant="primary" size="lg" disabled={pending !== null} onClick={() => download("png")}>
        {pending === "png" ? t("download.working") : t("download.primary")}
      </Button>
    </div>
  );
}
