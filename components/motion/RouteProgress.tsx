"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** A thin gold line across the top while a new page loads. */
export function RouteProgress() {
  const path = usePathname();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a");
      if (
        !a ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        a.target === "_blank"
      )
        return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      bar.current?.classList.remove("is-done");
      bar.current?.classList.add("is-loading");
    };
    document.addEventListener("click", start);
    return () => document.removeEventListener("click", start);
  }, []);

  useEffect(() => {
    const b = bar.current;
    if (!b?.classList.contains("is-loading")) return;
    b.classList.replace("is-loading", "is-done");
    const t = setTimeout(() => b.classList.remove("is-done"), 700);
    return () => clearTimeout(t);
  }, [path]);

  return <div ref={bar} className="route-progress" aria-hidden="true" />;
}
