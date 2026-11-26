import Link from "next/link";
import { db } from "@/lib/db";
import { reorderWorks } from "@/app/admin/actions/work";
import { WorkList } from "@/components/admin/lists";

export const metadata = { title: "Work" };

export default async function Work({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const rooms = await db.room.findMany({
    orderBy: { order: "asc" },
    include: { works: { orderBy: { order: "asc" } } },
  });
  const media = new Map(
    (
      await db.media.findMany({
        where: { id: { in: rooms.flatMap((r) => r.works.map((w) => w.posterId ?? w.mediaId)) } },
      })
    ).map((m) => [m.id, m.url]),
  );
  return (
    <>
      <div className="a-head">
        <h1 className="a-title">Work</h1>
        <Link href="/admin/work/new" className="a-btn primary">
          Add new work
        </Link>
      </div>
      {deleted && (
        <p className="a-flash" role="status">
          Deleted.
        </p>
      )}
      <p className="a-lede">
        Pieces marked <span className="a-pill warn">Sample art</span> are placeholders. Open one and upload
        your own work to replace it. “On home page” pieces fill the phones, frames and browser on the home
        page (the first three in each room).
      </p>
      {rooms.map((r) => (
        <section key={r.id} className="a-panel" aria-labelledby={`room-${r.id}`}>
          <h2 id={`room-${r.id}`}>
            <span className="ko a-ko" lang="ko">
              {r.korean}
            </span>{" "}
            {r.name}
          </h2>
          <WorkList
            onReorder={reorderWorks}
            works={r.works.map((w) => ({
              id: w.id,
              label: w.title,
              thumb: media.get(w.posterId ?? w.mediaId) ?? null,
              kind: w.mediaType,
              placeholder: w.isPlaceholder,
              visible: w.visible,
              featured: w.featured,
              category: w.category,
            }))}
          />
        </section>
      ))}
    </>
  );
}
