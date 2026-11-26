"use client";

import { useSyncExternalStore } from "react";

const KEY = "atelier-motion";
const html = () => document.documentElement;

// One source of truth: <html data-motion="paused">. The early inline script in
// the layout restores it from localStorage before first paint, and every
// pause button (header and phone menu) reads and writes that same attribute.
function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(html(), { attributes: true, attributeFilter: ["data-motion"] });
  return () => mo.disconnect();
}
const isPaused = () => html().dataset.motion === "paused";

/**
 * Pauses and resumes the page's breathing, the hero drift and the floating
 * loops. Continuous motion needs a way to stop it (WCAG 2.2.2). Remembered.
 * Hidden under prefers-reduced-motion, where the motion is already off.
 */
export function BreathToggle() {
  const paused = useSyncExternalStore(subscribe, isPaused, () => false);

  const toggle = () => {
    const next = !isPaused();
    if (next) html().dataset.motion = "paused";
    else delete html().dataset.motion;
    try {
      localStorage.setItem(KEY, next ? "paused" : "on");
    } catch {}
  };

  const label = paused ? "Resume the breathing animation" : "Pause the breathing animation";
  return (
    <button
      type="button"
      className="breath-toggle"
      onClick={toggle}
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
