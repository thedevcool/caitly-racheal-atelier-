import { describe, expect, it } from "vitest";
import type { Enquiry } from "@prisma/client";
import { quickCheck } from "@/lib/rules";
import { enquirySchema, fieldErrors } from "@/lib/validation";
import { checkFormToken, issueFormToken, MIN_FILL_MS } from "@/lib/formToken";
import { escapeHtml } from "@/lib/escape";
import { enquiryEmail } from "@/lib/mail";

const ok = { name: "Ada", email: "ada@example.com", room: "studio", message: "A travel site for my tours." };

describe("contact validation", () => {
  const cases: Record<string, Record<string, string>> = {
    valid: ok,
    "short name": { ...ok, name: "A" },
    "long name": { ...ok, name: "x".repeat(81) },
    "bad email": { ...ok, email: "ada@" },
    "no room": { ...ok, room: "" },
    "short message": { ...ok, message: "hi" },
    "long message": { ...ok, message: "x".repeat(4001) },
    "whitespace name": { ...ok, name: "   " },
  };

  it.each(Object.entries(cases))("browser and server agree: %s", (_label, input) => {
    const parsed = enquirySchema.safeParse(input);
    const server = parsed.success ? {} : fieldErrors(parsed.error);
    expect(quickCheck(input)).toEqual(server);
  });

  it("accepts the brief's limits exactly", () => {
    expect(enquirySchema.safeParse({ ...ok, name: "Al", message: "x".repeat(10) }).success).toBe(true);
    expect(enquirySchema.safeParse({ ...ok, name: "x".repeat(80), message: "x".repeat(4000) }).success).toBe(
      true,
    );
  });
});

describe("form token (minimum fill time)", () => {
  const t0 = 1_700_000_000_000;
  it("rejects a submit under 3 seconds", () => {
    expect(checkFormToken(issueFormToken(t0), t0 + MIN_FILL_MS - 1)).toBe("too-fast");
  });
  it("accepts a human-paced submit", () => {
    expect(checkFormToken(issueFormToken(t0), t0 + 45_000)).toBe("ok");
  });
  it("rejects forged or missing tokens", () => {
    const [ts] = issueFormToken(t0).split(".");
    expect(checkFormToken(`${ts}.forged`, t0 + 10_000)).toBe("invalid");
    expect(checkFormToken(`${t0 - 60_000}.${issueFormToken(t0).split(".")[1]}`, t0 + 10_000)).toBe("invalid");
    expect(checkFormToken(undefined)).toBe("invalid");
  });
  it("expires old tokens", () => {
    expect(checkFormToken(issueFormToken(t0), t0 + 13 * 3600_000)).toBe("expired");
  });
});

describe("notification email", () => {
  const enquiry = {
    id: "abc123",
    name: 'Eve <img src=x onerror="alert(1)">',
    email: "eve@example.com",
    room: "shopfront",
    budget: null,
    message: "<script>alert(1)</script>\nline two",
    status: "NEW",
    emailSent: false,
    ipHash: null,
    createdAt: new Date(),
  } as Enquiry;

  it("escapes every visitor field in the HTML", () => {
    const { html } = enquiryEmail(enquiry, "The Shopfront");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("line two"); // newlines become <br>
  });

  it("uses the brief's subject and links to the admin inbox", () => {
    const { subject, text } = enquiryEmail(enquiry, "The Shopfront");
    expect(subject).toBe(`New commission enquiry · The Shopfront · ${enquiry.name}`);
    expect(text).toContain("/admin/enquiries/abc123");
  });

  it("escapeHtml covers the five special characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
