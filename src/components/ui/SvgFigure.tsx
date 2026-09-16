import { useEffect, useRef } from "react";
import { mountSvg } from "../../core/render/mount";
import type { SvgNode } from "../../core/render/types";

/** Mounts a render tree as real DOM — decorative, so it is hidden from readers. */
export function SvgFigure({ node, className }: { node: SvgNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) mountSvg(ref.current, node);
  }, [node]);

  return <span ref={ref} className={className} aria-hidden="true" />;
}
