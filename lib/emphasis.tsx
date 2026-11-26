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

/**
 * Same as emphasis() but splits into words, for per-word reveals and
 * scroll-scrubbing. `space` says whether a space comes before the word, so
 * punctuation stays attached: "*face*, a" → "face" + "," (no space) + "a".
 */
export function emphasisWords(text: string) {
  const out: { word: string; em: boolean; space: boolean }[] = [];
  // A space can end one piece ("a ") and belong before the next word ("*face*"),
  // so carry it across pieces.
  let pendingSpace = false;
  text.split(/\*([^*]+)\*/g).forEach((part, i) => {
    for (const chunk of part.split(/(\s+)/)) {
      if (!chunk) continue;
      if (/^\s+$/.test(chunk)) {
        pendingSpace = true;
        continue;
      }
      out.push({ word: chunk, em: i % 2 === 1, space: out.length > 0 && pendingSpace });
      pendingSpace = false;
    }
  });
  return out;
}
