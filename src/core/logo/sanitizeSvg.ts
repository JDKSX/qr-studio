/**
 * SVG logos are the one place where a user-supplied file becomes markup, so
 * everything that can execute, fetch or navigate is stripped before the file is
 * allowed anywhere near the document.
 *
 * The result is re-serialised from the parsed tree, so anything the parser did
 * not understand is dropped rather than passed through.
 */

const ALLOWED_PROTOCOL = /^data:image\//i;

const FORBIDDEN_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "embed",
  "object",
  "audio",
  "video",
  "animate",
  "animatetransform",
  "animatemotion",
  "set",
  "handler",
  "listener",
]);

/** Attributes that can load or run something, rather than just describe geometry. */
const URL_ATTRIBUTES = ["href", "xlink:href", "src", "from", "to", "values", "begin"];

function scrubElement(element: Element): void {
  for (const child of Array.from(element.children)) {
    if (FORBIDDEN_TAGS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    scrubElement(child);
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;

    // Event handlers.
    if (name.startsWith("on")) {
      element.removeAttribute(attribute.name);
      continue;
    }
    // Anything that can pull in or run remote content.
    if (URL_ATTRIBUTES.includes(name)) {
      const trimmed = value.trim();
      const isInternalReference = trimmed.startsWith("#");
      if (!isInternalReference && !ALLOWED_PROTOCOL.test(trimmed)) {
        element.removeAttribute(attribute.name);
      }
      continue;
    }
    // url(...) in presentation attributes such as fill / filter / clip-path.
    if (/url\(\s*(['"]?)(?!#)/i.test(value)) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (/javascript:|data:text\/html/i.test(value)) {
      element.removeAttribute(attribute.name);
    }
  }
}

export interface SanitisedSvg {
  markup: string;
  /** width / height taken from the viewBox or the width/height attributes. */
  aspect: number;
}

export function sanitiseSvg(source: string): SanitisedSvg | null {
  const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
  if (parsed.getElementsByTagName("parsererror").length > 0) return null;

  const root = parsed.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") return null;

  scrubElement(root);
  for (const style of Array.from(root.getElementsByTagName("style"))) {
    // Inline CSS can still reach out via @import.
    if (/@import|url\(\s*(['"]?)(?!#)/i.test(style.textContent ?? "")) style.remove();
  }

  let aspect = 1;
  const viewBox = root.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2]! > 0 && parts[3]! > 0) aspect = parts[2]! / parts[3]!;
  } else {
    const width = Number.parseFloat(root.getAttribute("width") ?? "");
    const height = Number.parseFloat(root.getAttribute("height") ?? "");
    if (Number.isFinite(width) && Number.isFinite(height) && height > 0) aspect = width / height;
  }

  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return { markup: new XMLSerializer().serializeToString(root), aspect };
}
