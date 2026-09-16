import type { SvgNode } from "./types";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

export interface SerialiseOptions {
  /** Pixel width written onto the root element. Omit for a purely scalable file. */
  width?: number;
  height?: number;
  /** Adds the XML prolog. Needed for standalone `.svg` downloads. */
  standalone?: boolean;
}

function serialiseNode(node: SvgNode): string {
  const attrs = Object.entries(node.attrs ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
    .join("");

  const inner =
    (node.text !== undefined ? escapeXml(node.text) : "") +
    (node.children ?? []).map(serialiseNode).join("");

  return inner ? `<${node.tag}${attrs}>${inner}</${node.tag}>` : `<${node.tag}${attrs}/>`;
}

/**
 * Serialises the render tree to a standalone SVG document.
 * The output is real vector geometry — no rasterised image is ever embedded,
 * apart from a user-supplied logo, which keeps its own format.
 */
export function serialiseSvg(root: SvgNode, options: SerialiseOptions = {}): string {
  const withSize: SvgNode = {
    ...root,
    attrs: {
      ...root.attrs,
      ...(options.width !== undefined ? { width: options.width } : {}),
      ...(options.height !== undefined ? { height: options.height } : {}),
    },
  };
  const body = serialiseNode(withSize);
  return options.standalone ? `<?xml version="1.0" encoding="UTF-8"?>\n${body}` : body;
}
