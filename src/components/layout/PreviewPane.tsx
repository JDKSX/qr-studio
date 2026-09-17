import { useEffect, useRef, useState } from "react";
import { mountSvg } from "../../core/render/mount";
import { QuickDownload } from "../export/QuickDownload";
import type { QrPipeline } from "../../hooks/useQrPipeline";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { ScanReport } from "../validate/ScanReport";
import { ScanTestDialog } from "../validate/ScanTestDialog";

export function PreviewPane({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const stageRef = useRef<HTMLDivElement>(null);
  const transparent = useStudio((state) => state.design.background.transparent);
  const [testOpen, setTestOpen] = useState(false);

  /**
   * The code regenerates as you type, fast enough that nothing appears to
   * happen. The caption below the code stays put — it names what was encoded,
   * so there is always an answer to "did it pick up what I pasted?" — and it
   * flashes for a moment whenever a new code is actually drawn.
   */
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!pipeline.render) {
      stage.replaceChildren();
      return;
    }
    mountSvg(stage, pipeline.render.root);

    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 1200);
    return () => clearTimeout(timer);
  }, [pipeline.render]);

  const encoded = pipeline.encoded;
  const failed = !encoded.ok;

  return (
    <div className="preview">
      <div className="preview__frame">
        <div
          ref={stageRef}
          className="preview__stage"
          data-transparent={transparent || undefined}
          data-updated={justUpdated || undefined}
          style={{ aspectRatio: String(pipeline.aspect) }}
          hidden={failed}
        />

        {!failed ? (
          <p className="preview__status" data-flash={justUpdated || undefined} role="status">
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
              <path
                d="M4.6 8.3 6.9 10.6 11.4 5.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="preview__status-text">
              {pipeline.summary
                ? t("preview.generatedWith", { value: pipeline.summary })
                : t("preview.generated")}
            </span>
          </p>
        ) : null}

        {!encoded.ok ? (
          <div className="preview__placeholder" role="status">
            <p className="preview__placeholder-title">
              {encoded.reason === "empty" ? t("preview.empty") : t("preview.broken")}
            </p>
            <p className="preview__placeholder-detail">
              {encoded.reason === "empty"
                ? t("encode.empty")
                : encoded.reason === "too-large"
                  ? t("encode.tooLarge")
                  : t("encode.failed", { message: encoded.detail ?? "" })}
            </p>
            {pipeline.missing.length > 0 ? (
              <p className="preview__placeholder-detail">
                {t("preview.required", { fields: pipeline.missing.map((key) => t(key)).join(", ") })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <QuickDownload pipeline={pipeline} />

      {pipeline.render ? <ScanReport checks={pipeline.report.checks} worst={pipeline.report.worst} /> : null}

      <div className="preview__actions">
        <button type="button" className="link-button" onClick={() => setTestOpen(true)} disabled={failed}>
          {t("preview.testCamera")}
        </button>
      </div>

      <ScanTestDialog open={testOpen} expected={pipeline.payload} onClose={() => setTestOpen(false)} />
    </div>
  );
}
