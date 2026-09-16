import { FORMAT_LABELS, SIZE_PRESETS } from "../../core/export";
import type { ExportFormat } from "../../core/export";
import { buildFilename } from "../../core/export/filename";
import { useDownload } from "../../hooks/useDownload";
import type { QrPipeline } from "../../hooks/useQrPipeline";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { Card } from "../ui/Card";
import { Button } from "../ui/controls";
import { Field } from "../ui/Field";

const FORMATS: ReadonlyArray<ExportFormat> = ["png", "svg", "jpg", "webp"];

export function ExportPanel({ pipeline }: { pipeline: QrPipeline }) {
  const t = useT();
  const exportSize = useStudio((state) => state.exportSize);
  const setExportSize = useStudio((state) => state.setExportSize);
  const { download, pending, ready, webpSupported: webp } = useDownload(pipeline);

  return (
    <Card title={t("export.title")} description={t("export.description")}>
      <Field label={t("export.size")} wide tooltip={t("export.size.tip")}>
        <div className="size-row">
          {SIZE_PRESETS.map((size) => (
            <Button
              key={size}
              size="sm"
              variant={exportSize === size ? "primary" : "ghost"}
              aria-pressed={exportSize === size}
              onClick={() => setExportSize(size)}
            >
              {size}
            </Button>
          ))}
          <label className="size-custom">
            <span className="visually-hidden">{t("export.customSize")}</span>
            <input
              className="input"
              type="number"
              min={64}
              max={8192}
              step={64}
              value={exportSize}
              onChange={(event) => setExportSize(Number(event.target.value))}
            />
            <span aria-hidden="true">px</span>
          </label>
        </div>
      </Field>

      <div className="download-grid">
        {FORMATS.map((format) => (
          <Button
            key={format}
            variant={format === "png" ? "primary" : "secondary"}
            disabled={!ready || pending !== null || (format === "webp" && !webp)}
            onClick={() => download(format)}
          >
            {pending === format
              ? t("export.preparing")
              : t("export.download", { format: FORMAT_LABELS[format] })}
          </Button>
        ))}
      </div>

      <p className="field__help">
        {ready ? (
          <>
            {t("export.savesAs")} <code>{buildFilename(pipeline.slug, "png")}</code>
            {webp ? null : ` · ${t("export.noWebp")}`}
          </>
        ) : (
          t("export.needContent")
        )}
      </p>
    </Card>
  );
}
