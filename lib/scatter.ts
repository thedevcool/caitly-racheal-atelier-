import type { CSSProperties } from "react";

/**
 * Where each piece starts before it flies into place (see "Assemble" in
 * globals.css). Deterministic, so the server and browser agree and there is no
 * hydration mismatch.
 *
 * Wild on purpose: pieces spiral out along the golden angle (so no two start in
 * the same spot) to 45–115% of the screen away, so most start off-screen and
 * arrive from every side; they spin up to a full half-turn either way and start
 * anywhere from a third of their size to nearly double. Offsets are in vw/vh,
 * so it scatters the same on a phone.
 */
export function scatter(i: number): CSSProperties {
  const angle = i * 2.39996; // golden angle in radians
  const r = 45 + ((i * 37) % 71);
  return {
    "--sx": `${(Math.cos(angle) * r).toFixed(1)}vw`,
    "--sy": `${(Math.sin(angle) * r).toFixed(1)}vh`,
    "--sr": `${((i * 137) % 361) - 180}deg`,
    "--ss": (0.35 + ((i * 53) % 155) / 100).toFixed(2),
    "--d": `${i * 110}ms`,
  } as CSSProperties;
}
