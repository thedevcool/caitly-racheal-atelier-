/**
 * Brief section 4: "Every text/background pair must pass WCAG AA."
 * Reads the real tokens from app/globals.css for every tone (dark, light,
 * wall, dusk, paper) and checks the pairs the components actually use.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "../../app/globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Tokens declared in the first rule whose selector list contains `selector`. */
function tokens(selector: string) {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, sel]) =>
    sel.split(",").some((s) => s.trim() === selector),
  );
  if (!rule) throw new Error(`No rule for ${selector}`);
  return Object.fromEntries(
    [...rule[2].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
  );
}

function luminance(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TONES = {
  dark: '[data-theme="dark"]',
  light: '[data-theme="light"]',
  wall: ".tone-wall",
  dusk: ".tone-dusk",
  paper: ".tone-paper",
};

describe.each(Object.entries(TONES))("%s tone", (_name, selector) => {
  const t = tokens(selector);
  // Body-size text: 4.5:1
  it.each(["ink", "muted", "accent", "sub", "chip-ink"])("--%s on --bg passes AA (4.5:1)", (key) => {
    expect(ratio(t[key], t.bg)).toBeGreaterThanOrEqual(4.5);
  });
  // Korean room names are 30px display text: AA large is 3:1
  it("--accent-ko on --bg passes AA large (3:1)", () => {
    expect(ratio(t["accent-ko"], t.bg)).toBeGreaterThanOrEqual(3);
  });
  it("solid button text passes AA", () => {
    expect(ratio(t["solid-fg"], t["solid-bg"])).toBeGreaterThanOrEqual(4.5);
  });
});

it("gold CTA text passes AA", () => {
  expect(ratio("#0b0b0c", tokens(":root").gold ?? "#d4b47a")).toBeGreaterThanOrEqual(4.5);
});
