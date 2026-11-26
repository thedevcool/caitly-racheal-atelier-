"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { bool, optional, req, str, zodErrors } from "@/lib/formdata";

const schema = z.object({
  quote: req("The quote", 600),
  name: req("The name", 80),
  role: optional(80),
  visible: z.boolean(),
  confirm: z.literal(true, {
    message: "Please confirm this is a real client’s words, shared with their permission.",
  }),
});

export async function saveTestimonial(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = str(form, "id") || undefined;
  const parsed = schema.safeParse({
    quote: str(form, "quote").replace(/^[“"]|[”"]$/g, ""),
    name: str(form, "name"),
    role: str(form, "role"),
    visible: bool(form, "visible"),
    confirm: bool(form, "confirm"),
  });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", errors: zodErrors(parsed.error) };
  const { confirm: _c, ...d } = parsed.data;
  void _c;
  const data = { ...d, role: d.role || null };
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data: { ...data, order: await db.testimonial.count() } });
  publish();
  return { ok: true, message: "Saved. It’s live." };
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  await db.testimonial.delete({ where: { id } });
  publish();
}

export async function reorderTestimonials(ids: string[]) {
  await requireAdmin();
  await db.$transaction(ids.map((id, order) => db.testimonial.update({ where: { id }, data: { order } })));
  publish();
}
