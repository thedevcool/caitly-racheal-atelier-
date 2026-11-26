/**
 * Mobile first is a hard rule for this project: base styles are the phone
 * layout, and larger screens are enhanced with min-width queries only.
 * This fails if a desktop-first (max-width) media query sneaks back in.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sheets = ["app/globals.css", "app/admin/admin.css"];

describe.each(sheets)("%s", (file) => {
  const css = readFileSync(path.join(__dirname, "../..", file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const queries = [...css.matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1].trim());

  it("uses only min-width (or preference) media queries", () => {
    const desktopFirst = queries.filter((q) => /max-width/.test(q));
    expect(desktopFirst).toEqual([]);
  });

  it("states the mobile-first rule at the top", () => {
    expect(readFileSync(path.join(__dirname, "../..", file), "utf8")).toMatch(/MOBILE FIRST/);
  });
});
