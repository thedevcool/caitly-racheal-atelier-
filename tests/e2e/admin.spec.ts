import { expect, test } from "./fixtures";
import { ADMIN_PASSWORD, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(
  !ADMIN_PASSWORD,
  "Set E2E_ADMIN_PASSWORD (and ADMIN_EMAIL / ADMIN_PASSWORD_HASH) to run admin tests",
);

test("the admin is locked without a session", async ({ page, request }) => {
  await page.goto("/admin/work");
  await expect(page).toHaveURL(/\/admin\/login/);
  const csv = await request.get("/admin/enquiries/export", { maxRedirects: 0 });
  expect([302, 303, 307, 401]).toContain(csv.status());
  const upload = await request.post("/api/admin/upload-local", { maxRedirects: 0 });
  expect([302, 303, 307, 401]).toContain(upload.status());
});

test("a wrong password is refused and the email is kept", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("someone@example.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Enter the atelier" }).click();
  await expect(page.locator("#login-error")).toContainText("don’t match");
  await expect(page.getByLabel("Email")).toHaveValue("someone@example.test");
});

test("Caitly can sign in and sees her dashboard and checklist", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Replace the sample art" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Replace" }).first()).toBeVisible();
});

test("a visitor's enquiry lands in the admin inbox", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only, to stay well under the 5-per-hour enquiry limit");
  const email = `inbox-${Date.now()}@example.test`;
  await page.goto("/#commission");
  const form = page.getByRole("form", { name: "Commission enquiry" });
  await expect(form.getByRole("button", { name: "Send my brief" })).toBeEnabled();
  await form.getByRole("textbox", { name: "Your name" }).fill("Inbox Visitor");
  await form.getByRole("textbox", { name: "Email" }).fill(email);
  await form
    .getByRole("textbox", { name: "Tell me about the piece" })
    .fill("Please make me a travel website.");
  await page.waitForTimeout(3200);
  await form.getByRole("button", { name: "Send my brief" }).click();
  await expect(page.locator(".brief-back")).toContainText("감사합니다", { timeout: 15_000 });

  await signIn(page);
  await page.goto(`/admin/enquiries?q=${encodeURIComponent(email)}`);
  await expect(page.locator(".a-inbox li")).toHaveCount(1);
  await expect(page.locator(".a-inbox li")).toContainText("Inbox Visitor");
  await page.locator(".a-inbox a").click();
  await expect(page.getByRole("link", { name: "Reply by email" })).toHaveAttribute("href", /^mailto:inbox-/);
  const csv = await page.request.get("/admin/enquiries/export");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain('"Name","Email","Room"');
});

test("uploads are checked by their bytes, not their name", async ({ page }) => {
  await signIn(page);
  const status = await page.evaluate(async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File(['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'], "x.jpg", {
        type: "image/jpeg",
      }),
    );
    return (await fetch("/api/admin/upload-local", { method: "POST", body: fd })).status;
  });
  expect(status).toBe(400);
});

test("a failed save keeps unsaved edits, and Preview shows them without saving", async ({
  page,
  context,
}) => {
  await signIn(page);
  await page.goto("/admin/content");
  const headline = page.getByLabel("Headline").first();
  await headline.fill("I breathe *life into brands.");
  const intro = page.getByLabel("Intro").first();
  await intro.fill("An unsaved intro for the preview test.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("needs a star on both sides")).toBeVisible();
  await expect(intro).toHaveValue("An unsaved intro for the preview test.");

  await headline.fill("I breathe *life* into brands.");
  const [preview] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Preview" }).click(),
  ]);
  await expect(preview.locator(".hero .intro")).toHaveText("An unsaved intro for the preview test.");
  await expect(preview.getByRole("status").filter({ hasText: "Previewing unsaved changes" })).toBeVisible();
  await preview.getByRole("link", { name: "Exit preview" }).click();
  await expect(preview.locator(".hero .intro")).not.toHaveText("An unsaved intro for the preview test.");
});
