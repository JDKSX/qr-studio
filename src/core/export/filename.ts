/** Builds a safe, human friendly download name such as `jdks-qr-github-com.svg`. */

const PREFIX = "jdks-qr";

/** Strips anything that could confuse a filesystem or a shell. */
export function slugify(value: string, maxLength = 40): string {
  const cleaned = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return cleaned || "code";
}

export function buildFilename(slug: string, extension: string): string {
  return `${PREFIX}-${slugify(slug)}.${extension}`;
}
