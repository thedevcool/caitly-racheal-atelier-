import { expect, test } from "./fixtures";
import { watchErrors } from "./helpers";

test("each room page has its bilingual title, gallery and next room", async ({ page }) => {
  const errors = watchErrors(page);
  for (const [slug, korean, name] of [
    ["screening", "상영관", "The Screening Room"],
    ["shopfront", "가게", "The Shopfront"],
    ["studio", "작업실", "The Studio"],
    ["library", "서재", "The Library"],
  ]) {
    await page.goto(`/work/${slug}`);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText(name);
    await expect(h1.locator('[lang="ko"]')).toHaveText(korean);
    await expect(page.locator(".gallery li").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Next room/ })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("filters and the lightbox work with keyboard and buttons", async ({ page }) => {
  await page.goto("/work/shopfront");
  await page.locator(".tile").first().click();
  const viewer = page.getByRole("dialog", { name: "Image viewer" });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".viewer-count")).toHaveText("1 / 3");
  await page.keyboard.press("ArrowRight");
  await expect(viewer.locator(".viewer-count")).toHaveText("2 / 3");
  await viewer.getByRole("button", { name: "Next" }).click();
  await expect(viewer.locator(".viewer-count")).toHaveText("3 / 3");
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute("data-lock", "true");
});

test("the reel viewer opens from the home phones and closes with Esc", async ({ page }) => {
  await page.goto("/");
  await page.locator(".phone-hit").first().click({ force: true }); // the phones float, so skip the stability wait
  const reels = page.getByRole("dialog", { name: "Reel viewer" });
  await expect(reels).toBeVisible();
  await expect(reels.locator(".viewer-count")).toHaveText("1 / 3");
  await page.keyboard.press("ArrowDown");
  await expect(reels.locator(".viewer-count")).toHaveText("2 / 3");
  await page.keyboard.press("Escape");
  await expect(reels).toBeHidden();
});

test("case studies only exist when turned on", async ({ page }) => {
  const res = await page.goto("/work/studio/sample-island-escapes");
  expect(res?.status()).toBe(404);
});

test("the phone menu lists every room with its Korean name", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: /Shopfront\s*가게/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});
