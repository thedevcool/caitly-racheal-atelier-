"use client";

import { useState } from "react";

let firstLoad = true;

/**
 * Route transitions: each new page fades in with a slight upward drift. The
 * very first page skips it, so nothing delays the first paint (or LCP).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => {
    const a = !firstLoad;
    firstLoad = false;
    return a;
  });
  return <div className={animate ? "route-fade" : undefined}>{children}</div>;
}
