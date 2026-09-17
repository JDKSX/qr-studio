import type { TranslationKey } from "../../i18n/en";

export type ContentTypeId =
  | "url"
  | "text"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "vcard"
  | "whatsapp"
  | "geo"
  | "event";

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "password"
  | "select"
  | "checkbox"
  | "datetime";

/** All content forms are flat string maps so the whole thing is trivially serialisable. */
export type ContentValues = Record<string, string>;

export interface FieldDef {
  name: string;
  labelKey: TranslationKey;
  kind: FieldKind;
  /** Literal example text — URLs and phone numbers read the same in any language. */
  placeholder?: string;
  /** Use instead of `placeholder` when the hint is prose. */
  placeholderKey?: TranslationKey;
  helpKey?: TranslationKey;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  options?: ReadonlyArray<{ value: string; labelKey: TranslationKey }>;
  /** Hide the field unless the current values satisfy this predicate. */
  showIf?: (values: ContentValues) => boolean;
  /** Spans the full width of the two column form grid. */
  wide?: boolean;
}

export interface ContentSchema {
  id: ContentTypeId;
  labelKey: TranslationKey;
  /** Short hint rendered under the type selector. */
  hintKey: TranslationKey;
  fields: ReadonlyArray<FieldDef>;
  defaults: ContentValues;
  /** Turns form values into the exact string that gets encoded into the QR. */
  build: (values: ContentValues) => string;
  /** Human friendly fragment used for the download filename and history label. */
  slug: (values: ContentValues) => string;
  /** Short, readable description of what the code points at, for the status line. */
  summary: (values: ContentValues) => string;
}
