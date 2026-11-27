import { expect, test } from "./fixtures";
import { watchErrors } from "./helpers";
import type { Page } from "@playwright/test";

/** Phones keep the theme and motion controls in the menu (mobile first). */
async function controls(page: Page) {
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) {
    await menu.click();
    return page.getByRole("dialog", { name: "Menu" });
  }
  return page.locator("nav.nav");
}

test("home renders every section from the database", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I breathe life into brands.");
  await expect(page.locator("h1 em")).toHaveText("life");
  await expect(page.getByText("Your business already has a story.")).toBeVisible();

  // Four rooms, each with its Korean name in lang="ko"
  for (const [id, korean] of [
    ["screening", "상영관"],
    ["shopfront", "가게"],
    ["studio", "작업실"],
    ["library", "서재"],
  ]) {
    const room = page.locator(`section#${id}`);
    await expect(room).toBeVisible();
    await expect(room.locator('[lang="ko"]').first()).toHaveText(korean);
  }

  await expect(page.locator(".phone")).toHaveCount(3);
  await expect(page.locator(".frame")).toHaveCount(3);
  await expect(page.locator("#commission form")).toBeVisible();
  await expect(page.locator("footer")).toContainText("Caitly Racheal Atelier");

  // Drafts and empty lists stay hidden: no packages, never fake testimonials
  await expect(page.locator("#packages")).toHaveCount(0);
  await expect(page.locator("blockquote")).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("every image has alt text", async ({ page }) => {
  await page.goto("/");
  const missing = await page.locator("img:not([alt])").count();
  expect(missing).toBe(0);
});

test("theme toggle switches dark and light and remembers the choice", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await (await controls(page)).getByRole("button", { name: "Switch to light mode" }).click();
  await page.keyboard.press("Escape");
  await expect(html).toHaveAttribute("data-theme", "light");
  // The body fades between themes over 0.6s; toHaveCSS retries until it settles.
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 241, 232)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect((await controls(page)).getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
});

test("the page breathes, and the breath can be paused", async ({ page, isMobile }) => {
  test.info().annotations.push({
    type: "device",
    description: isMobile ? "pause lives in the menu" : "pause in the header",
  });
  await page.goto("/");
  const breathing = await page.evaluate(
    () => document.getAnimations().filter((a) => /breathe/.test((a as CSSAnimation).animationName)).length,
  );
  expect(breathing).toBeGreaterThan(5);

  await (await controls(page)).getByRole("button", { name: "Pause the breathing animation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await expect(page.locator(".breath-veil")).toHaveCSS("animation-play-state", "paused");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await (await controls(page)).getByRole("button", { name: "Resume the breathing animation" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "paused");
});

test("reduced motion turns the breathing off", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".breath-veil")).toBeHidden();
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => /breathe|drift/.test((a as CSSAnimation).animationName)).length,
  );
  expect(running).toBe(0);
  await context.close();
});

test("commission form explains errors, then sends and thanks the visitor", async ({ page }, info) => {
  await page.goto("/#commission");
  const form = page.getByRole("form", { name: "Commission enquiry" });
  const send = form.getByRole("button", { name: "Send my brief" });
  await expect(send).toBeEnabled(); // the signed fill-time token has arrived

  await send.click();
  const name = form.getByRole("textbox", { name: "Your name" });
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Please tell me your name.")).toBeVisible();
  await expect(name).toBeFocused();

  await name.fill("Test Visitor");
  await form.getByRole("textbox", { name: "Email" }).fill(`visitor-${info.project.name}@example.test`);
  await form.getByRole("combobox", { name: "What do you need?" }).selectOption({ index: 2 });
  await form
    .getByRole("textbox", { name: "Tell me about the piece" })
    .fill("A short brief about my new product.");
  await page.waitForTimeout(3200); // the server rejects forms filled faster than 3s
  await send.click();

  await expect(page.locator(".brief-back")).toContainText("감사합니다", { timeout: 15_000 });
  await expect(page.locator(".brief-back")).toContainText("two working days");
});

test("a form filled in under three seconds is refused, and keeps what was typed", async ({ page }) => {
  await page.goto("/#commission");
  const form = page.getByRole("form", { name: "Commission enquiry" });
  await expect(form.getByRole("button", { name: "Send my brief" })).toBeEnabled();
  await form.getByRole("textbox", { name: "Your name" }).fill("Speedy");
  await form.getByRole("textbox", { name: "Email" }).fill("speedy@example.test");
  await form.getByRole("textbox", { name: "Tell me about the piece" }).fill("Filled in a hurry by a bot.");
  // give the token just under the minimum age
  await form.getByRole("button", { name: "Send my brief" }).click();
  await expect(form.getByRole("alert")).toContainText("take a moment");
  await expect(form.getByRole("textbox", { name: "Your name" })).toHaveValue("Speedy");
});

test("unknown pages show the on-brand 404", async ({ page }) => {
  const res = await page.goto("/no-such-room");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This room is empty." })).toBeVisible();
  await expect(page.getByText("이 방은 비어 있어요.")).toBeVisible();
  await page.getByRole("link", { name: "Return to the atelier" }).click();
  await expect(page).toHaveURL("/");
});

test("the intro plays once per session, then never again", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage(); // no fixture: a true first visit
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bintro\b/);
  await expect(page.locator("[data-intro]")).toBeVisible();
  await expect(page.locator("[data-intro]")).toBeHidden({ timeout: 4000 });
  await page.goto("/privacy");
  await expect(page.locator("html")).not.toHaveClass(/\bintro\b/);
  await context.close();
});

test.describe("first-load assembly", () => {
  const assembling = (page: import("@playwright/test").Page) =>
    page.evaluate(
      () =>
        document.getAnimations().filter((a) => /^(assemble|hang)$/.test((a as CSSAnimation).animationName))
          .length,
    );

  test("the hero arrives in pieces and every piece lands in place", async ({ browser }) => {
    const context = await browser.newContext(); // a true first visit (no fixture)
    const page = await context.newPage();
    await page.goto("/");
    expect(await page.locator(".hero .piece").count()).toBeGreaterThan(8);
    expect(await assembling(page)).toBeGreaterThan(8);
    await expect(page.locator(".guides")).toBeAttached();
    // settled: nothing still moving, every piece exactly in place
    await expect.poll(() => assembling(page), { timeout: 13000 }).toBe(0);
    const offset = await page.evaluate(
      () =>
        [...document.querySelectorAll(".piece:not(.btn)")].filter(
          (e) => getComputedStyle(e).transform !== "none",
        ).length,
    );
    expect(offset).toBe(0);
    await context.close();
  });

  test("a tap skips straight to the finished page", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // tap as soon as the page is there, well inside the skip window
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.mouse.click(5, 5);
    await expect(page.locator("html")).toHaveClass(/intro-skip/);
    expect(await assembling(page)).toBe(0);
    await context.close();
  });

  test("never plays under reduced motion or when motion is paused", async ({ browser }) => {
    const reduced = await browser.newContext({ reducedMotion: "reduce" });
    const r = await reduced.newPage();
    await r.goto("/");
    expect(await assembling(r)).toBe(0);
    await reduced.close();

    const paused = await browser.newContext();
    await paused.addInitScript(() => localStorage.setItem("atelier-motion", "paused"));
    const p = await paused.newPage();
    await p.goto("/");
    expect(await assembling(p)).toBe(0);
    await paused.close();
  });
});

test.describe("assembly on every page view", () => {
  const assembling = (page: import("@playwright/test").Page) =>
    page.evaluate(
      () => document.getAnimations().filter((a) => (a as CSSAnimation).animationName === "assemble").length,
    );

  test("a room reached by in-site navigation assembles with the caption, and again on a revisit", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await expect.poll(() => assembling(page), { timeout: 13000 }).toBe(0); // home has finished

    // A room by in-site navigation: no name intro, but it assembles and narrates
    await page
      .locator("#shopfront")
      .getByRole("link", { name: /Enter the room/ })
      .click();
    await expect(page).toHaveURL(/\/work\/shopfront/);
    await expect(page.locator("html")).toHaveClass(/\bassembling\b/);
    await expect(page.locator("html")).not.toHaveClass(/\bintro\b/);
    expect(await assembling(page)).toBeGreaterThan(3);
    await expect(page.locator(".asm-caption")).toBeVisible();
    await expect(page.locator(".asm-working")).toContainText("Rebranding this page");
    await expect(page.locator(".asm-done")).toContainText("your brand");
    // it finishes and cleans up
    await expect(page.locator("html")).not.toHaveClass(/\bassembling\b/, { timeout: 10000 });
    await expect(page.locator(".asm-caption")).toBeHidden();

    // Every visit plays it again (but the name intro stays once per session)
    await page.goto("/work/shopfront");
    await expect(page.locator("html")).toHaveClass(/\bassembling\b/);
    await expect(page.locator("html")).not.toHaveClass(/\bintro\b/);
    expect(await assembling(page)).toBeGreaterThan(3);
    await context.close();
  });

  test("a page landed on directly also assembles, with the caption hidden from screen readers", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/privacy");
    await expect(page.locator("html")).toHaveClass(/\bassembling\b/);
    await expect(page.locator(".asm-working")).toHaveText(/\S/);
    await expect(page.locator(".asm-caption")).toHaveAttribute("aria-hidden", "true");
    await context.close();
  });
});

test("below the first screen, the page builds itself piece by piece as it scrolls in", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => sessionStorage.setItem("atelier-intro", "1")); // no name intro
  const page = await context.newPage();
  await page.goto("/");
  // wait for the motion libraries (loaded after idle) to hide what's below the fold
  const heading = page.locator("#commission h2");
  await expect.poll(() => heading.evaluate((e) => getComputedStyle(e).opacity), { timeout: 15000 }).toBe("0");

  // record every piece that wears the building outline, and the most at once
  await page.evaluate(() => {
    const w = window as unknown as { built: Set<Element>; most: number };
    w.built = new Set();
    w.most = 0;
    new MutationObserver(() => {
      const now = document.querySelectorAll(".is-building");
      now.forEach((e) => w.built.add(e));
      w.most = Math.max(w.most, now.length);
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
  });
  await heading.scrollIntoViewIfNeeded();
  // it builds, and lands exactly in place
  await expect.poll(() => heading.locator(".rw-i").count(), { timeout: 5000 }).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        heading.evaluate((h) =>
          [...h.querySelectorAll(".rw-i")].every(
            (w) => getComputedStyle(w).opacity === "1" && getComputedStyle(w).transform === "none",
          ),
        ),
      { timeout: 20000 },
    )
    .toBe(true);
  const { built, most } = await page.evaluate(() => {
    const w = window as unknown as { built: Set<Element>; most: number };
    return { built: w.built.size, most: w.most };
  });
  expect(built).toBeGreaterThan(1);
  // one at a time, in sequence: never the whole section at once
  expect(most).toBeLessThanOrEqual(12);
  // nothing makes the page scroll sideways while pieces fly in
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("with reduced motion the contact form can still be filled in and sent", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    sessionStorage.setItem("atelier-intro", "1");
    sessionStorage.setItem("atelier-seen", JSON.stringify("*"));
  });
  const page = await context.newPage();
  await page.goto("/#commission");
  const form = page.getByRole("form", { name: "Commission enquiry" });
  await expect(form.getByRole("button", { name: "Send my brief" })).toBeEnabled();
  // nothing may sit on top of the fields (the hidden thank-you side once did)
  await form.getByRole("textbox", { name: "Your name" }).fill("Calm Visitor");
  await form.getByRole("textbox", { name: "Email" }).fill("calm@example.test");
  await form
    .getByRole("textbox", { name: "Tell me about the piece" })
    .fill("A calm brief, sent with reduced motion on.");
  await page.waitForTimeout(3200);
  // Like a person: finish typing, bring Send into view, then tap where it actually is
  // (a real tap at the button's position, so nothing on top of it may swallow it)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const send = form.getByRole("button", { name: "Send my brief" });
  await send.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await send.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator(".brief-back")).toContainText("감사합니다", { timeout: 15_000 });
  await context.close();
});
