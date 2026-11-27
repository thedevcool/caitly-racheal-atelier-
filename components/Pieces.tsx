import type { CSSProperties } from "react";
import { scatter } from "@/lib/scatter";

/**
 * Helpers for the first-visit assembly. A "piece" is an element that starts
 * scattered and flies into place when its page is first seen (see "Assemble"
 * in globals.css). Pieces must be block or inline-block: inline boxes can't
 * be transformed.
 */
export const piece = (i: number): { className: string; style: CSSProperties } => ({
  className: "piece",
  style: scatter(i),
});

/** Splits text into word pieces (numbered from `start`), keeping the spaces. */
export function PieceWords({ text, start }: { text: string; start: number }) {
  return (
    <>
      {text
        .split(/\s+/)
        .filter(Boolean)
        .map((word, i) => (
          <span key={i}>
            {i > 0 && " "}
            <span className="piece pw" style={scatter(start + i)}>
              {word}
            </span>
          </span>
        ))}
    </>
  );
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
