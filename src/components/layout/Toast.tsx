import { useEffect } from "react";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";

export function Toast() {
  const t = useT();
  const toast = useStudio((state) => state.toast);
  const dismiss = useStudio((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast ? (
        <div className="toast" data-tone={toast.tone} key={toast.id}>
          <span>{toast.message}</span>
          <button type="button" className="toast__close" onClick={dismiss} aria-label={t("toast.dismiss")}>
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
