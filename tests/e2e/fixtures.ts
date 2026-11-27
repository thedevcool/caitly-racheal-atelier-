import { test as base } from "@playwright/test";

/**
 * Every test starts as a returning visitor in this session who has already
 * seen every page, so neither the name intro nor the first-visit assembly
 * runs and nothing is in flight while tests click and measure.
 * (The intro and the assembly are covered in home.spec.ts with fresh contexts.)
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("atelier-intro", "1");
        sessionStorage.setItem("atelier-seen", JSON.stringify("*"));
      } catch {}
    });
    await provide(page);
  },
});
export { expect } from "@playwright/test";
