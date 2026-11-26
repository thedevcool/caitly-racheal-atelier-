"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { balancedStars, bool, commaList, optional, req, str, zodErrors } from "@/lib/formdata";

const schema = z.object({
  name: req("The room name", 60),
  korean: req("The Korean name", 30),
  navLabel: req("The menu label", 30),
  service: req("The form option", 60),
  headline: req("The headline", 120).refine(balancedStars, "Each *italic* word needs a star on both sides."),
  body: req("The description", 600),
  chips: z.array(z.string().max(30, "Each chip can be up to 30 characters.")).max(10, "Ten chips at most."),
  ctaLabel: req("The button", 40),
  galleryTitle: optional(80),
  galleryCaption: optional(120),
  theme: z.enum(["dark", "wall", "dusk", "paper"]),
  visible: z.boolean(),
});

const readRoom = (f: FormData) => ({
  name: str(f, "name"),
  korean: str(f, "korean"),
  navLabel: str(f, "navLabel"),
  service: str(f, "service"),
  headline: str(f, "headline"),
  body: str(f, "body"),
  chips: commaList(f, "chips"),
  ctaLabel: str(f, "ctaLabel"),
  galleryTitle: str(f, "galleryTitle"),
  galleryCaption: str(f, "galleryCaption"),
  theme: str(f, "theme"),
  visible: bool(f, "visible"),
});

export async function saveRoom(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = str(form, "id");
  const parsed = schema.safeParse(readRoom(form));
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", errors: zodErrors(parsed.error) };
  const d = parsed.data;
  if (!d.visible && (await db.room.count({ where: { visible: true, id: { not: id } } })) === 0) {
    return {
      ok: false,
      message: "At least one room must stay visible.",
      errors: { visible: "At least one room must stay visible." },
    };
  }
  await db.room.update({
    where: { id },
    data: { ...d, galleryTitle: d.galleryTitle || null, galleryCaption: d.galleryCaption || null },
  });
  publish();
  return { ok: true, message: "Saved. Your changes are live." };
}

export async function reorderRooms(ids: string[]) {
  await requireAdmin();
  await db.$transaction(ids.map((id, order) => db.room.update({ where: { id }, data: { order } })));
  publish();
}
