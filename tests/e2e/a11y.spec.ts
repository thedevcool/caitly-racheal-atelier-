import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

/** Automated accessibility checks (WCAG 2.x A/AA) on every kind of page, in both themes. */
const pages = [
  "/",
  "/work/screening",
  "/work/shopfront",
  "/work/library",
  "/privacy",
  "/admin/login",
  "/no-such-page",
];

for (const theme of ["dark", "light"] as const) {
  for (const path of pages) {
    test(`${path} has no serious accessibility issues (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("atelier-theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" }); // check the settled page, not mid-animation
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serious.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 4)
              .join(" | ")}`,
        ),
      ).toEqual([]);
    });
  }
}
