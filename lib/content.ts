import { unstable_cache } from "next/cache";
import type { Media, Package, Room, Work } from "@prisma/client";
import { db } from "./db";

/** Every public read is tagged "content"; admin saves call revalidateTag("content"). */
export const CONTENT_TAG = "content";

export type WorkWithMedia = Work & { media: Media | null; poster: Media | null };
export type RoomWithContent = Room & { works: WorkWithMedia[]; packages: Package[] };

async function mediaMap(ids: (string | null | undefined)[]) {
  const list = ids.filter((x): x is string => !!x);
  const rows = list.length ? await db.media.findMany({ where: { id: { in: list } } }) : [];
  return new Map(rows.map((m) => [m.id, m]));
}

export const getHomeContent = unstable_cache(
  async () => {
    const [settings, rooms, testimonials] = await Promise.all([
      db.siteSettings.findUnique({ where: { id: 1 } }),
      db.room.findMany({
        where: { visible: true },
        orderBy: { order: "asc" },
        include: {
          works: { where: { visible: true }, orderBy: { order: "asc" } },
          packages: { where: { visible: true }, orderBy: { order: "asc" } },
        },
      }),
      db.testimonial.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    ]);
    if (!settings) throw new Error("Site settings missing. Run `pnpm db:seed`.");

    const media = await mediaMap([
      settings.heroImageId,
      settings.contactImageId,
      ...rooms.flatMap((r) => r.works.flatMap((w) => [w.mediaId, w.posterId])),
    ]);
    const roomsWithMedia: RoomWithContent[] = rooms.map((r) => ({
      ...r,
      works: r.works.map((w) => ({
        ...w,
        media: media.get(w.mediaId) ?? null,
        poster: w.posterId ? (media.get(w.posterId) ?? null) : null,
      })),
    }));

    return {
      settings,
      heroImage: settings.heroImageId ? (media.get(settings.heroImageId) ?? null) : null,
      contactImage: settings.contactImageId ? (media.get(settings.contactImageId) ?? null) : null,
      rooms: roomsWithMedia,
      testimonials,
    };
  },
  ["home-content"],
  { tags: [CONTENT_TAG] },
);

export const getSettings = unstable_cache(
  async () => db.siteSettings.findUnique({ where: { id: 1 } }),
  ["site-settings"],
  { tags: [CONTENT_TAG] },
);

export type HomeContent = Awaited<ReturnType<typeof getHomeContent>>;
