import { CONTENT_SCHEMAS, CONTENT_TYPE_ORDER } from "../core/encode/contentSchemas";
import type { ContentTypeId, ContentValues } from "../core/encode/types";

/** Every content type starts from its own schema defaults. */
export function initialValues(): Record<ContentTypeId, ContentValues> {
  const entries = CONTENT_TYPE_ORDER.map((id) => [id, { ...CONTENT_SCHEMAS[id].defaults }] as const);
  return Object.fromEntries(entries) as Record<ContentTypeId, ContentValues>;
}

export const DEFAULT_EXPORT_SIZE = 1024;

/** Shown the moment the page opens, so the studio is never an empty form. */
export const SAMPLE_CONTENT_TYPE: ContentTypeId = "url";
