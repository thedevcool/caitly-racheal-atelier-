import { expect, test } from "./fixtures";
import { ADMIN_PASSWORD, signIn } from "./helpers";

/**
 * Mobile first (hard rule). At common phone widths, every page must:
 * - never scroll sideways
 * - give every control a 44 × 44px target (inline text links excepted, per WCAG 2.5.8)
 * - use 16px+ form fields (so iOS never zooms in)
 * - keep text at 12px or more (the decorative website mockup excepted)
 */
const PUBLIC = [
  "/",
  "/work/screening",
  "/work/shopfront",
  "/work/studio",
  "/work/library",
  "/privacy",
  "/no-such-page",
];
const ADMIN = [
  "/admin",
  "/admin/enquiries",
  "/admin/work",
  "/admin/work/new",
  "/admin/content",
  "/admin/rooms",
  "/admin/packages",
  "/admin/testimonials",
  "/admin/settings",
];
const WIDTHS = [320, 360, 390, 414];

type Report = {
  overflow: number;
  offenders: string[];
  smallTargets: string[];
  smallInputs: string[];
  tinyText: string[];
};

async function audit(page: import("@playwright/test").Page): Promise<Report> {
  // load lazy content and settle reveals
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 20));
    }
    scrollTo(0, 0);
  });
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    // Horizontal carousels scroll inside themselves on purpose
    const scrollers =
      ".phones, .frames, .lightbox-track, .a-nav, .a-tabs, dialog, .viewport, .hero-parallax, .contact-media, .ink-stage, .breath-veil, .grain";
    const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== "fixed" && !e.closest(scrollers)
        );
      })
      .slice(0, 5)
      .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join(".")}`);

    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return (
        r.width > 0 &&
        r.height > 0 &&
        cs.visibility !== "hidden" &&
        cs.opacity !== "0" &&
        !e.closest(".hp, .sr-only, dialog:not([open]), [aria-hidden='true']")
      );
    };
    const smallTargets = [
      ...document.querySelectorAll<HTMLElement>("a, button, select, textarea, summary, input"),
    ]
      .filter((e) => visible(e))
      .filter((e) => !(e instanceof HTMLInputElement && (e.type === "hidden" || e.type === "checkbox")))
      // inline links inside running text are exempt (WCAG 2.5.8 "inline")
      .filter(
        (e) =>
          !(
            e.tagName === "A" &&
            !e.className &&
            e.closest("p, dd, .prose, .a-hint, .a-lede, .a-empty, .a-alert, .a-note")
          ),
      )
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width < 43.5 || r.height < 43.5;
      })
      .map((e) => {
        const r = e.getBoundingClientRect();
        return `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`;
      });

    const smallInputs = [
      ...document.querySelectorAll<HTMLElement>(
        "input:not([type=hidden]):not([type=checkbox]), select, textarea",
      ),
    ]
      .filter((e) => visible(e) && parseFloat(getComputedStyle(e).fontSize) < 16)
      .map((e) => e.getAttribute("name") ?? e.tagName);

    const tinyText = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
      .filter(
        (e) =>
          visible(e) &&
          !e.closest(".viewport, .bar, .intro-overlay, .cursor") &&
          parseFloat(getComputedStyle(e).fontSize) < 12,
      )
      .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join(".")} ${getComputedStyle(e).fontSize}`);

    return {
      overflow: document.documentElement.scrollWidth - vw,
      offenders,
      smallTargets,
      smallInputs,
      tinyText,
    };
  });
}

function expectClean(r: Report) {
  expect.soft(r.overflow, `sideways scroll caused by: ${r.offenders.join(", ")}`).toBe(0);
  expect.soft(r.smallTargets, "tap targets under 44px").toEqual([]);
  expect.soft(r.smallInputs, "form fields under 16px").toEqual([]);
  expect.soft(r.tinyText, "text under 12px").toEqual([]);
}

test.describe("mobile first: public pages", () => {
  for (const width of WIDTHS) {
    test(`all public pages work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      for (const path of PUBLIC) {
        await test.step(path, async () => {
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          expectClean(await audit(page));
        });
      }
    });
  }
});

test.describe("mobile first: admin", () => {
  test.skip(!ADMIN_PASSWORD, "needs the admin test login");
  for (const width of [320, 390]) {
    test(`every admin screen works at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await signIn(page);
      for (const path of ["/admin/login", ...ADMIN]) {
        await test.step(path, async () => {
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          expectClean(await audit(page));
        });
      }
    });
  }
});

test("on phones the menu button replaces the inline links, and the phones are a swipe carousel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.locator(".links")).toBeHidden();
  // one-row header: just the name and the menu button
  const nav = await page.locator("nav.nav").boundingBox();
  expect(nav!.height).toBeLessThan(100);
  await expect(page.locator(".nav-buttons > .breath-toggle")).toBeHidden();
  await expect(page.locator(".phones")).toHaveCSS("overflow-x", "auto");
  await expect(page.locator(".phone-dots")).toBeVisible();
  await expect(page.locator(".frames")).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(page.locator("#screening .wrap")).toHaveCSS("grid-template-columns", /^\d+(\.\d+)?px$/); // one column
});

test("desktop is the enhancement: inline links, fanned phones, two-column rooms", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator(".links")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await expect(page.locator(".phone-dots")).toBeHidden();
  await expect(page.locator("#screening .wrap")).toHaveCSS("grid-template-columns", /px .*px/); // two columns
});
