import type { SvgNode } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Builds real DOM nodes from the render tree.
 *
 * Deliberately not `innerHTML`: the tree carries user-controlled strings
 * (frame labels, logo data URLs, colours) and building nodes explicitly means
 * none of it is ever parsed as markup.
 */
export function createSvgElement(node: SvgNode): SVGElement {
  const element = document.createElementNS(SVG_NS, node.tag) as SVGElement;

  for (const [key, value] of Object.entries(node.attrs ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    element.setAttribute(key, String(value));
  }

  if (node.text !== undefined) element.textContent = node.text;

  for (const child of node.children ?? []) {
    element.appendChild(createSvgElement(child));
  }

  return element;
}

/** Replaces the contents of `container` with a freshly built SVG. */
export function mountSvg(container: HTMLElement, node: SvgNode): SVGElement {
  const svg = createSvgElement(node);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  container.replaceChildren(svg);
  return svg;
}
