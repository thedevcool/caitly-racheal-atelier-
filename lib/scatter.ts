import type { CSSProperties } from "react";

/**
 * Where each hero piece starts before it flies into place on first load
 * (see "Assemble" in globals.css). Deterministic, so the server and browser
 * agree and there is no hydration mismatch: pieces spiral out along the
 * golden angle, so no two land in the same spot, at 22–46% of the screen away,
 * tilted up to ±24°. Offsets are in vw/vh, so it scatters the same on a phone.
 */
export function scatter(i: number): CSSProperties {
  const angle = i * 2.39996; // golden angle in radians
  const r = 22 + ((i * 37) % 25);
  return {
    "--sx": `${(Math.cos(angle) * r).toFixed(1)}vw`,
    "--sy": `${(Math.sin(angle) * r * 0.75).toFixed(1)}vh`,
    "--sr": `${((i * 47) % 49) - 24}deg`,
    "--d": `${i * 70}ms`,
  } as CSSProperties;
}
