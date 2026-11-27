"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

let firstLoad = true;
let assemblyTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Route transitions: each new page fades in with a slight upward drift. The
 * very first page skips it, so nothing delays the first paint (or LCP).
 *
 * It also starts the first-visit assembly for pages reached by in-site
 * navigation (the very first page is handled by the early script in the
 * layout, before paint). Uses the same "atelier-seen" list in sessionStorage.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [animate] = useState(() => {
    const a = !firstLoad;
    firstLoad = false;
    return a;
  });

  // Layout effect: runs after the new page is in the DOM but before it paints,
  // so pieces start scattered rather than flashing into place first.
  useLayoutEffect(() => {
    if (!animate) return;
    const d = document.documentElement;
    if (!d.classList.contains("motion") || d.dataset.motion === "paused" || path.startsWith("/admin")) return;
    let seen: string[] | string = [];
    try {
      seen = JSON.parse(sessionStorage.getItem("atelier-seen") || "[]");
    } catch {}
    if (seen === "*" || !Array.isArray(seen) || seen.includes(path)) return;
    try {
      sessionStorage.setItem("atelier-seen", JSON.stringify([...seen, path]));
    } catch {}

    // Restart the animations: drop the classes, force a style flush, add again
    d.classList.remove("assembling", "intro", "intro-skip");
    void d.offsetWidth;
    d.classList.add("assembling");
    clearTimeout(assemblyTimer);
    assemblyTimer = setTimeout(() => d.classList.remove("assembling"), 4400);

    const t0 = Date.now();
    const off = () => {
      removeEventListener("click", skip);
      removeEventListener("keydown", skip);
    };
    const skip = () => {
      if (Date.now() - t0 < 3500) d.classList.add("intro-skip");
      off();
    };
    addEventListener("click", skip);
    addEventListener("keydown", skip);
    return off;
  }, [path, animate]);

  return <div className={animate ? "route-fade" : undefined}>{children}</div>;
}
