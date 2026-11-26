"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { publish, requireAdmin, type ActionResult } from "@/lib/admin";
import { bool, optional, req, slugify, str, url, zodErrors } from "@/lib/formdata";
import { mediaFromForm } from "@/lib/mediaSave";

const schema = z.object({
  roomId: z.string().min(1, "Please choose a room."),
  title: req("The title", 100),
  category: optional(40),
  hook: optional(160),
  client: optional(80),
  description: optional(2000),
  externalUrl: url,
  featured: z.boolean(),
  visible: z.boolean(),
  showCaseStudy: z.boolean(),
});

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base);
  for (let n = 2; await db.work.findFirst({ where: { slug, id: { not: exceptId } } }); n++)
    slug = `${slugify(base)}-${n}`;
  return slug;
}

/** Studio pieces carry the browser mockup's menu line and up to three tour cards. */
function readMeta(f: FormData) {
  const tours = [0, 1, 2]
    .map((i) => ({ name: str(f, `tour${i}Name`), detail: str(f, `tour${i}Detail`) }))
    .filter((t) => t.name);
  const nav = str(f, "metaNav");
  return nav || tours.length ? { nav, tours } : undefined;
}

export async function saveWork(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = str(form, "id") || undefined;
  const parsed = schema.safeParse({
    roomId: str(form, "roomId"),
    title: str(form, "title"),
    category: str(form, "category"),
    hook: str(form, "hook"),
    client: str(form, "client"),
    description: str(form, "description"),
    externalUrl: str(form, "externalUrl"),
    featured: bool(form, "featured"),
    visible: bool(form, "visible"),
    showCaseStudy: bool(form, "showCaseStudy"),
  });
  const media = await mediaFromForm(form, "media", { required: true, label: "an image or video" });
  const errors: Record<string, string> = {
    ...(parsed.success ? {} : zodErrors(parsed.error)),
    ...(media.error ?? {}),
  };

  // Videos need a poster (brief §8)
  let posterId: string | null = null;
  if (media.id) {
    const m = await db.media.findUnique({ where: { id: media.id } });
    if (m?.kind === "VIDEO") {
      posterId = str(form, "mediaPosterId") || null;
      if (!posterId) errors.mediaPosterId = "Please add a poster: upload one or use a frame from the video.";
      else await db.media.update({ where: { id: posterId }, data: { alt: m.alt } });
    }
  }
  if (!parsed.success || Object.keys(errors).length)
    return { ok: false, message: "Please check the highlighted fields.", errors };

  const d = parsed.data;
  const kind = (await db.media.findUnique({ where: { id: media.id! } }))!.kind;
  const data = {
    roomId: d.roomId,
    title: d.title,
    category: d.category || null,
    hook: d.hook || null,
    client: d.client || null,
    description: d.description || null,
    externalUrl: d.externalUrl || null,
    featured: d.featured,
    visible: d.visible,
    showCaseStudy: d.showCaseStudy,
    mediaType: kind,
    mediaId: media.id!,
    posterId,
    meta: readMeta(form) ?? undefined,
  };

  if (id) {
    const before = await db.work.findUnique({ where: { id } });
    if (!before) return { ok: false, message: "This piece no longer exists." };
    // Uploading new media clears the placeholder flag (brief §8)
    const replaced = before.mediaId !== media.id || before.posterId !== posterId;
    await db.work.update({
      where: { id },
      data: { ...data, slug: before.slug, isPlaceholder: replaced ? false : before.isPlaceholder },
    });
    publish();
    return {
      ok: true,
      message:
        replaced && before.isPlaceholder
          ? "Saved, and the sample art is replaced. It’s live."
          : "Saved. Your changes are live.",
      id,
    };
  }

  const order = (await db.work.count({ where: { roomId: d.roomId } })) + 1;
  const created = await db.work.create({
    data: { ...data, slug: await uniqueSlug(d.title), order, isPlaceholder: false },
  });
  publish();
  redirect(`/admin/work/${created.id}?saved=1`);
}

export async function deleteWork(form: FormData) {
  await requireAdmin();
  await db.work.delete({ where: { id: str(form, "id") } });
  publish();
  redirect("/admin/work?deleted=1");
}

export async function reorderWorks(ids: string[]) {
  await requireAdmin();
  await db.$transaction(ids.map((id, order) => db.work.update({ where: { id }, data: { order } })));
  publish();
}
