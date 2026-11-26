"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { bool, lines, optional, req, str, zodErrors } from "@/lib/formdata";

const schema = z.object({
  roomId: z.string().min(1, "Please choose a room."),
  name: req("The name", 80),
  korean: optional(30),
  priceFrom: req("The price", 60).refine(
    (v) => !v.includes("[your price]"),
    "Please replace “[your price]” with your price.",
  ),
  items: z.array(z.string().max(120)).max(12, "Twelve lines at most."),
  featured: z.boolean(),
  visible: z.boolean(),
});

export async function savePackage(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = str(form, "id") || undefined;
  const visible = bool(form, "visible");
  const raw = {
    roomId: str(form, "roomId"),
    name: str(form, "name"),
    korean: str(form, "korean"),
    priceFrom: str(form, "priceFrom"),
    items: lines(form, "items"),
    featured: bool(form, "featured"),
    visible,
  };
  // A hidden draft may keep the placeholder price; a published package may not
  const parsed = (visible ? schema : schema.extend({ priceFrom: req("The price", 60) })).safeParse(raw);
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", errors: zodErrors(parsed.error) };
  const data = { ...parsed.data, korean: parsed.data.korean || null };
  if (id) await db.package.update({ where: { id }, data });
  else await db.package.create({ data: { ...data, order: await db.package.count() } });
  publish();
  return { ok: true, message: visible ? "Saved. It’s live." : "Saved as a hidden draft." };
}

export async function deletePackage(id: string) {
  await requireAdmin();
  await db.package.delete({ where: { id } });
  publish();
}

export async function reorderPackages(ids: string[]) {
  await requireAdmin();
  await db.$transaction(ids.map((id, order) => db.package.update({ where: { id }, data: { order } })));
  publish();
}
