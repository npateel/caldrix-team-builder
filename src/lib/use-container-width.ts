import { useEffect, useRef, useState } from "react";

// Measures an element's rendered width. Several layouts here switch on
// measured container width rather than a CSS breakpoint, because they
// change structure -- which cells or columns exist at all -- and not just
// sizing, which media queries can't express.
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
