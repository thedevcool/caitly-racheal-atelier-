"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { bool, req, str, url, zodErrors } from "@/lib/formdata";
import { sendTestEmail } from "@/lib/mail";
import { mediaFromForm } from "@/lib/mediaSave";

const email = z
  .string()
  .trim()
  .max(254)
  .refine((v) => !v || z.string().email().safeParse(v).success, "That email doesn’t look right.");

const schema = z.object({
  displayEmail: email,
  notifyEmail: email,
  instagram: url,
  tiktok: url,
  etsy: url,
  seoTitle: req("The page title", 70),
  seoDescription: req("The description", 170),
  cursorEnabled: z.boolean(),
  confirmVisitor: z.boolean(),
  defaultTheme: z.enum(["dark", "light", "system"]),
});

export async function saveSettings(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse({
    displayEmail: str(form, "displayEmail"),
    notifyEmail: str(form, "notifyEmail"),
    instagram: str(form, "instagram"),
    tiktok: str(form, "tiktok"),
    etsy: str(form, "etsy"),
    seoTitle: str(form, "seoTitle"),
    seoDescription: str(form, "seoDescription"),
    cursorEnabled: bool(form, "cursorEnabled"),
    confirmVisitor: bool(form, "confirmVisitor"),
    defaultTheme: str(form, "defaultTheme"),
  });
  const og = await mediaFromForm(form, "ogImage", { label: "a share image" });
  if (!parsed.success || og.error) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: { ...(parsed.success ? {} : zodErrors(parsed.error)), ...(og.error ?? {}) },
    };
  }
  const d = parsed.data;
  await db.siteSettings.update({
    where: { id: 1 },
    data: {
      ...d,
      displayEmail: d.displayEmail || null,
      instagram: d.instagram || null,
      tiktok: d.tiktok || null,
      etsy: d.etsy || null,
      ogImageId: og.id,
    },
  });
  publish();
  return { ok: true, message: "Saved. Your changes are live." };
}

export async function testEmail(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });
  const to = str(form, "to") || s?.notifyEmail || process.env.SMTP_USER || "";
  if (!to) return { ok: false, message: "Add a notification email first." };
  const r = await sendTestEmail(to);
  return { ok: r.ok, message: r.message };
}
