import "server-only";
import { cookies, draftMode } from "next/headers";
import { db } from "./db";

/**
 * "Preview" stores unsaved editor values in a Draft row and turns on Next's
 * draft mode; public pages then merge the draft over the saved content.
 */
export type DraftData = {
  settings?: Record<string, string | boolean>;
  rooms?: Record<string, Record<string, string | string[] | boolean>>;
};

export const DRAFT_COOKIE = "atelier-draft";

export async function startDraft(data: DraftData) {
  // prune drafts older than a day
  await db.draft.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  const d = await db.draft.create({ data: { data } });
  (await draftMode()).enable();
  (await cookies()).set(DRAFT_COOKIE, d.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 3600,
  });
}

export async function getDraft(): Promise<DraftData | null> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const id = (await cookies()).get(DRAFT_COOKIE)?.value;
  if (!id) return null;
  const d = await db.draft.findUnique({ where: { id } });
  return (d?.data as DraftData) ?? null;
}

/** Overlay a draft on loaded content (only keys present in the draft change). */
export function applyDraft<T extends { settings: object; rooms: { slug: string }[] }>(
  content: T,
  draft: DraftData | null,
): T {
  if (!draft) return content;
  return {
    ...content,
    settings: { ...content.settings, ...(draft.settings ?? {}) },
    rooms: content.rooms.map((r) => ({ ...r, ...(draft.rooms?.[r.slug] ?? {}) })),
  };
}
