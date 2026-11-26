import { expect, test, type Page } from "@playwright/test";

/** Fail any test that logs a console error or throws on the page. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
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

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  // The body fades between themes over 0.6s; toHaveCSS retries until it settles.
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 241, 232)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
});

test("the page breathes, and the breath can be paused", async ({ page }) => {
  await page.goto("/");
  const breathing = await page.evaluate(
    () => document.getAnimations().filter((a) => /breathe/.test((a as CSSAnimation).animationName)).length,
  );
  expect(breathing).toBeGreaterThan(5);

  await page.getByRole("button", { name: "Pause the breathing animation" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await expect(page.locator(".breath-veil")).toHaveCSS("animation-play-state", "paused");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await page.getByRole("button", { name: "Resume the breathing animation" }).click();
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

test("commission form explains errors, then thanks the visitor", async ({ page }) => {
  await page.goto("/#commission");
  const form = page.getByRole("form", { name: "Commission enquiry" });

  await form.getByRole("button", { name: "Send my brief" }).click();
  const name = form.getByRole("textbox", { name: "Your name" });
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Please tell me your name.")).toBeVisible();
  await expect(name).toBeFocused();

  await name.fill("Test Visitor");
  await form.getByRole("textbox", { name: "Email" }).fill("visitor@example.com");
  await form.getByRole("combobox", { name: "What do you need?" }).selectOption({ index: 2 });
  await form
    .getByRole("textbox", { name: "Tell me about the piece" })
    .fill("A short brief about my new product.");
  await form.getByRole("button", { name: "Send my brief" }).click();

  await expect(form.getByRole("status")).toContainText("감사합니다");
});

test("unknown pages show the on-brand 404", async ({ page }) => {
  const res = await page.goto("/no-such-room");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This room is empty." })).toBeVisible();
  await expect(page.getByText("이 방은 비어 있어요.")).toBeVisible();
  await page.getByRole("link", { name: "Return to the atelier" }).click();
  await expect(page).toHaveURL("/");
});
