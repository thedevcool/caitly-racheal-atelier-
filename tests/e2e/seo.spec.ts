import { expect, test } from "./fixtures";

test("robots, sitemap, share image and structured data", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("/sitemap.xml");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const room of ["screening", "shopfront", "studio", "library"])
    expect(sitemap).toContain(`/work/${room}`);

  const og = await request.get("/og");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");

  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og|blob/);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  const types = ld["@graph"].map((n: { "@type": string }) => n["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Person", "ProfessionalService"]));
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
