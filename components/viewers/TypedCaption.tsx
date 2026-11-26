"use client";

import { useEffect, useState } from "react";

/** Types the ad hook on when `active` turns true. Full text for screen readers and reduced motion. */
export function TypedCaption({ text, active }: { text: string; active: boolean }) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 34);
    return () => clearInterval(id);
  }, [active, text]);
  return (
    <b>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <span style={{ visibility: "hidden" }}>{text.slice(n)}</span>
      </span>
    </b>
  );
}
