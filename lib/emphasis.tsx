import { Fragment, type ReactNode } from "react";

/**
 * Turns "I breathe *life* into brands." into React elements with <em> around
 * the starred words. Never produces HTML strings (brief section 11), so
 * admin-entered text can't inject markup.
 */
export function emphasis(text: string): ReactNode {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Same as emphasis() but splits into words, for per-word reveals and scroll-scrubbing. */
export function emphasisWords(text: string) {
  const out: { word: string; em: boolean }[] = [];
  text.split(/\*([^*]+)\*/g).forEach((part, i) => {
    part
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => out.push({ word, em: i % 2 === 1 }));
  });
  return out;
}
