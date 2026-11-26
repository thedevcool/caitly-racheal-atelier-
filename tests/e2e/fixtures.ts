import { test as base } from "@playwright/test";

/**
 * Every test starts as a returning visitor in this session, so the
 * once-per-session intro overlay doesn't sit over the page.
 * (The intro itself is covered in home.spec.ts.)
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        if (!(window as unknown as { __keepIntro?: boolean }).__keepIntro)
          sessionStorage.setItem("atelier-intro", "1");
      } catch {}
    });
    await provide(page);
  },
});
export { expect } from "@playwright/test";
