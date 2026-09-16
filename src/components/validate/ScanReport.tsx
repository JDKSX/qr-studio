import { useId, useState } from "react";
import type { Check, CheckLevel } from "../../core/validate";
import { useT } from "../../hooks/useT";
import type { TranslationKey } from "../../i18n";
import { useStudio } from "../../state/store";
import { Button } from "../ui/controls";

const ICONS: Record<CheckLevel, string> = {
  ok: "M3.5 8.5 6.5 11.5 12.5 4.5",
  info: "M8 7.2v4M8 4.4v.1",
  warn: "M8 5v4M8 11.4v.1",
  error: "M5 5l6 6M11 5l-6 6",
  pending: "M8 3.5v4.5l3 1.8",
};

const SUMMARY: Record<CheckLevel, TranslationKey> = {
  ok: "report.ok",
  info: "report.ok",
  pending: "report.pending",
  warn: "report.warn",
  error: "report.error",
};

function CheckRow({ check }: { check: Check }) {
  const applyFix = useStudio((state) => state.applyFix);

  return (
    <li className="check" data-level={check.level}>
      <span className="check__icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="15" height="15">
          {check.level === "pending" || check.level === "info" ? (
            <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          ) : null}
          <path
            d={ICONS[check.level]}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="check__body">
        <span className="check__title">{check.title}</span>
        {check.detail ? <span className="check__detail">{check.detail}</span> : null}
      </span>
      {check.fix ? (
        <Button size="sm" variant="ghost" onClick={() => applyFix(check.fix!.action)}>
          {check.fix.label}
        </Button>
      ) : null}
    </li>
  );
}

/**
 * Collapsed by default.
 *
 * A wall of green ticks is noise — what matters is "is it fine?" plus anything
 * that actually needs attention. Problems always show; the passing checks are
 * one click away for anyone who wants the detail.
 */
export function ScanReport({ checks, worst }: { checks: ReadonlyArray<Check>; worst: CheckLevel }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const problems = checks.filter((check) => check.level === "warn" || check.level === "error");
  const visible = expanded ? checks : problems;
  const passed = checks.length - problems.length;

  return (
    <div className="scan-report" data-level={worst}>
      <button
        type="button"
        className="scan-report__head"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="scan-report__dot" aria-hidden="true" />
        <span className="scan-report__title">{t(SUMMARY[worst])}</span>
        <span className="scan-report__count">
          {problems.length > 0
            ? t("report.issues", { n: problems.length })
            : t("report.allGood", { n: passed })}
        </span>
        <svg className="scan-report__chevron" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <path
            d="M4 6.5 8 10.5 12 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ul className="check-list" id={panelId} aria-live="polite" hidden={visible.length === 0}>
        {visible.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>
    </div>
  );
}
