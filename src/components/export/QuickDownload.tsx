import { FORMAT_LABELS } from "../../core/export";
import type { ExportFormat } from "../../core/export";
import { useDownload } from "../../hooks/useDownload";
import type { QrPipeline } from "../../hooks/useQrPipeline";
import { useT } from "../../hooks/useT";
import { Button } from "../ui/controls";

const SECONDARY: ReadonlyArray<ExportFormat> = ["svg", "jpg", "webp"];

function CopyIcon({ done }: { done: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      {done ? (
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <rect x="5.5" y="5.5" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10.5 3.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/**
 * The two things people actually want to do with a finished code.
 *
 * Copying matters as much as downloading: most codes are pasted straight into
 * a chat or a slide, and a file on disk is just clutter in that case.
 */
export function QuickDownload({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const { download, copy, pending, copyState, copySupported, ready, webpSupported } = useDownload(pipeline);
  const copied = copyState === "copied";

  return (
    <div className="quick-download">
      <div className="quick-download__actions">
        <Button variant="primary" size="lg" disabled={!ready || pending !== null} onClick={() => download("png")}>
          {pending === "png" ? t("download.working") : t("download.primary")}
        </Button>
        {copySupported ? (
          <Button
            variant="secondary"
            size="lg"
            data-copied={copied || undefined}
            disabled={!ready || copyState === "working"}
            icon={<CopyIcon done={copied} />}
            onClick={copy}
          >
            {copied ? t("download.copied") : copyState === "working" ? t("download.working") : t("download.copy")}
          </Button>
        ) : null}
      </div>

      {copySupported ? <p className="quick-download__hint">{t("download.copyHint")}</p> : null}

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
 * buttons with it. This bar keeps both actions on screen; it is hidden on
 * wider layouts where the preview column is always visible.
 */
export function MobileDownloadBar({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const { download, copy, pending, copyState, copySupported, ready } = useDownload(pipeline);
  const copied = copyState === "copied";

  if (!ready) return null;

  return (
    <div className="mobile-download">
      <Button variant="primary" size="lg" disabled={pending !== null} onClick={() => download("png")}>
        {pending === "png" ? t("download.working") : t("download.primary")}
      </Button>
      {copySupported ? (
        <Button
          variant="secondary"
          size="lg"
          data-copied={copied || undefined}
          disabled={copyState === "working"}
          icon={<CopyIcon done={copied} />}
          onClick={copy}
          aria-label={t("download.copy")}
        >
          {copied ? t("download.copied") : t("download.copy")}
        </Button>
      ) : null}
    </div>
  );
}
