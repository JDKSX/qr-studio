import { useCallback, useEffect, useRef, useState } from "react";
import { decodeImageData } from "../../core/validate/decode";
import { useT } from "../../hooks/useT";
import { Button } from "../ui/controls";

type Phase = "idle" | "starting" | "scanning" | "found" | "unsupported" | "error";

interface ScanTestDialogProps {
  open: boolean;
  expected: string;
  onClose(): void;
}

/**
 * Point a real camera at the code on screen (or at a print of it) and see what
 * a scanner actually reads. Falls back gracefully when there is no camera or
 * the browser blocks access — the round-trip check in the report still covers
 * the important case.
 */
export function ScanTestDialog({ open, expected, onClose }: ScanTestDialogProps) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState<"scan.noCamera" | "scan.blocked" | "scan.failed">("scan.failed");

  const stop = useCallback(() => {
    if (frameRef.current !== undefined) {
      clearTimeout(frameRef.current);
      frameRef.current = undefined;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      setPhase("idle");
      setResult(null);
      return;
    }

    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase("unsupported");
        setMessageKey("scan.noCamera");
        return;
      }

      setPhase("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setPhase("scanning");
        tick();
      } catch (error) {
        if (cancelled) return;
        setPhase("error");
        setMessageKey(
          error instanceof Error && error.name === "NotAllowedError" ? "scan.blocked" : "scan.failed",
        );
      }
    };

    const tick = () => {
      const video = videoRef.current;
      if (!video || cancelled) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width && height) {
        const canvas = document.createElement("canvas");
        // Downscale: decoding a 4K frame every 350ms is wasted work.
        const scale = Math.min(1, 640 / Math.max(width, height));
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          void decodeImageData(image)
            .then(({ text }) => {
              if (cancelled || !text) return;
              setResult(text);
              setPhase("found");
              stop();
            })
            .catch(() => undefined);
        }
      }

      frameRef.current = setTimeout(tick, 350) as unknown as number;
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, stop]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-test-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id="scan-test-title">{t("scan.title")}</h2>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t("scan.close")}>
            {t("common.close")}
          </Button>
        </header>

        <div className="modal__body">
          {phase === "unsupported" || phase === "error" ? (
            <p className="inline-error" role="alert">
              {t(messageKey)}
            </p>
          ) : (
            <div className="scan-stage">
              <video
                ref={videoRef}
                className="scan-stage__video"
                playsInline
                muted
                aria-label={t("scan.cameraLabel")}
              />
              {phase === "starting" ? <p className="scan-stage__status">{t("scan.starting")}</p> : null}
              {phase === "scanning" ? <p className="scan-stage__status">{t("scan.aim")}</p> : null}
            </div>
          )}

          {result !== null ? (
            <div className="scan-result" data-match={result === expected || undefined} role="status">
              <strong>{result === expected ? t("scan.matched") : t("scan.mismatched")}</strong>
              <code>{result.slice(0, 220)}</code>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
