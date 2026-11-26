"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { balancedStars, optional, req, str, zodErrors } from "@/lib/formdata";
import { mediaFromForm } from "@/lib/mediaSave";

const italic = (label: string, max: number) =>
  req(label, max).refine(balancedStars, "Each *italic* word needs a star on both sides.");

const schema = z.object({
  heroKorean: req("The Korean line", 120),
  heroHeadline: italic("The headline", 120),
  heroIntro: req("The intro", 400),
  heroCtaPrimary: req("The first button", 40),
  heroCtaSecondary: req("The second button", 40),
  statement: italic("The statement", 300),
  contactKorean: req("The Korean line", 120),
  contactHeadline: italic("The headline", 120),
  contactIntro: req("The intro", 400),
  contactButton: req("The button", 40),
  footerTagline: req("The tagline", 120),
  footerNote: optional(300),
});

const readContent = (form: FormData) =>
  Object.fromEntries(Object.keys(schema.shape).map((k) => [k, str(form, k)]));

export async function saveContent(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(readContent(form));
  const hero = await mediaFromForm(form, "heroImage", { required: true, label: "a hero image" });
  const contact = await mediaFromForm(form, "contactImage", { required: true, label: "a contact image" });
  const errors = {
    ...(parsed.success ? {} : zodErrors(parsed.error)),
    ...(hero.error ?? {}),
    ...(contact.error ?? {}),
  };
  if (!parsed.success || hero.error || contact.error)
    return { ok: false, message: "Please check the highlighted fields.", errors };

  await db.siteSettings.update({
    where: { id: 1 },
    data: {
      ...parsed.data,
      footerNote: parsed.data.footerNote || null,
      heroImageId: hero.id,
      contactImageId: contact.id,
    },
  });
  publish();
  return { ok: true, message: "Saved. Your changes are live." };
}
