/**
 * Escaping helpers for the QR payload formats.
 *
 * Each format has its own rules — mixing them up is the classic reason a
 * "valid looking" QR fails to import on a phone. The backslash is kept in a
 * constant so the escape sequences below stay readable.
 */

const BS = String.fromCharCode(92);

/** MECARD-style escaping used by the WIFI: scheme. Backslash must go first. */
export function escapeWifi(value: string): string {
  return value.replace(/[\\;,:"]/g, (char) => BS + char);
}

/** RFC 6350 / vCard 3.0 text value escaping. */
export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, BS + BS)
    .replace(/\r?\n/g, BS + "n")
    .replace(/;/g, BS + ";")
    .replace(/,/g, BS + ",");
}

/** RFC 5545 TEXT value escaping. */
export function escapeICal(value: string): string {
  return value
    .replace(/\\/g, BS + BS)
    .replace(/\r?\n/g, BS + "n")
    .replace(/;/g, BS + ";")
    .replace(/,/g, BS + ",");
}

/** Digits and a single leading "+" — what tel:/SMSTO:/wa.me all expect. */
export function normalisePhone(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/** wa.me refuses the "+" prefix. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Joins non-empty lines with CRLF, as both vCard and iCalendar require. */
export function crlf(lines: ReadonlyArray<string | false | null | undefined>): string {
  return lines.filter((line): line is string => Boolean(line)).join("\r\n");
}

/** "2026-09-16T14:30" (datetime-local) -> "20260916T143000" floating local time. */
export function toICalLocal(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return "";
  const [, y, m, d, hh, mm] = match;
  return `${y}${m}${d}T${hh}${mm}00`;
}
