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
   * The code regenerates as you type, which is fast enough to be invisible —
   * people paste a URL and cannot tell anything happened. This flashes a short
   * confirmation each time a new code is actually drawn.
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
    const timer = setTimeout(() => setJustUpdated(false), 1600);
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
          <p className="preview__status" data-visible={justUpdated || undefined} role="status">
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("preview.generated")}
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
