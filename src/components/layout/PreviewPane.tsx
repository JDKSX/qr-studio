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

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!pipeline.render) {
      stage.replaceChildren();
      return;
    }
    mountSvg(stage, pipeline.render.root);
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
          style={{ aspectRatio: String(pipeline.aspect) }}
          hidden={failed}
        />
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
