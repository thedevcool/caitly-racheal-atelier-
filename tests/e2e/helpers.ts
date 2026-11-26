import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

/** Collect console errors and page exceptions; assert none at the end. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

export async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Enter the atelier" }).click();
  await expect(page.getByRole("heading", { name: /Good to see you/ })).toBeVisible();
}
