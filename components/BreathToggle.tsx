"use client";

import { useEffect, useState } from "react";

const KEY = "atelier-motion";

/**
 * Pauses and resumes the page's breathing (and the hero drift). Continuous
 * motion needs a way to stop it (WCAG 2.2.2). The choice is remembered.
 * Hidden under prefers-reduced-motion, where the motion is already off.
 */
export function BreathToggle() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === "paused") setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
    try {
      localStorage.setItem(KEY, paused ? "paused" : "on");
    } catch {}
  }, [paused]);

  const label = paused ? "Resume the breathing animation" : "Pause the breathing animation";
  return (
    <button
      type="button"
      className="breath-toggle"
      onClick={() => setPaused((p) => !p)}
      aria-label={label}
      aria-pressed={paused}
      title={label}
    >
      {paused ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
          <rect x="14" y="5" width="3.5" height="14" rx="1" />
        </svg>
      )}
    </button>
  );
}
