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

/** A room's full page: its visible work, packages, and the next visible room. */
export const getRoomPage = unstable_cache(
  async (slug: string) => {
    const rooms = await db.room.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, korean: true },
    });
    const i = rooms.findIndex((r) => r.slug === slug);
    if (i === -1) return null;
    const room = await db.room.findUnique({
      where: { slug },
      include: {
        works: { where: { visible: true }, orderBy: { order: "asc" } },
        packages: { where: { visible: true }, orderBy: { order: "asc" } },
      },
    });
    if (!room) return null;
    const media = await mediaMap(room.works.flatMap((w) => [w.mediaId, w.posterId]));
    const works: WorkWithMedia[] = room.works.map((w) => ({
      ...w,
      media: media.get(w.mediaId) ?? null,
      poster: w.posterId ? (media.get(w.posterId) ?? null) : null,
    }));
    return {
      room: { ...room, works },
      next: rooms.length > 1 ? rooms[(i + 1) % rooms.length] : null,
      navRooms: await db.room.findMany({
        where: { visible: true },
        orderBy: { order: "asc" },
        select: { slug: true, navLabel: true, name: true, korean: true },
      }),
    };
  },
  ["room-page"],
  { tags: [CONTENT_TAG] },
);

/** A single piece, for its optional case-study page. */
export const getWorkPage = unstable_cache(
  async (roomSlug: string, slug: string) => {
    const work = await db.work.findFirst({
      where: { slug, visible: true, showCaseStudy: true, room: { slug: roomSlug, visible: true } },
      include: { room: true },
    });
    if (!work) return null;
    const media = await mediaMap([work.mediaId, work.posterId]);
    const navRooms = await db.room.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      select: { slug: true, navLabel: true, name: true, korean: true },
    });
    return {
      work: {
        ...work,
        media: media.get(work.mediaId) ?? null,
        poster: work.posterId ? (media.get(work.posterId) ?? null) : null,
      },
      navRooms,
    };
  },
  ["work-page"],
  { tags: [CONTENT_TAG] },
);

export const getRoomSlugs = unstable_cache(
  async () =>
    (await db.room.findMany({ where: { visible: true }, select: { slug: true } })).map((r) => r.slug),
  ["room-slugs"],
  { tags: [CONTENT_TAG] },
);

export const getCaseStudyParams = unstable_cache(
  async () =>
    (
      await db.work.findMany({
        where: { visible: true, showCaseStudy: true, room: { visible: true } },
        select: { slug: true, room: { select: { slug: true } } },
      })
    ).map((w) => ({ room: w.room.slug, slug: w.slug })),
  ["case-study-params"],
  { tags: [CONTENT_TAG] },
);
