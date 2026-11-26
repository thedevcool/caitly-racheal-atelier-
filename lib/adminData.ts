import "server-only";
import type { Media } from "@prisma/client";
import { db } from "./db";
import type { MediaValue } from "@/components/admin/MediaField";

export const toMediaValue = (m: Media | null | undefined): MediaValue =>
  m ? { id: m.id, url: m.url, kind: m.kind, alt: m.alt } : null;

export async function mediaById(id: string | null | undefined) {
  return id ? db.media.findUnique({ where: { id } }) : null;
}

export async function roomOptions() {
  return (await db.room.findMany({ orderBy: { order: "asc" } })).map((r) => ({ value: r.id, label: r.name }));
}
