import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { mediaById } from "@/lib/adminData";
import { storageMode } from "@/lib/mediaSave";
import { deleteWork } from "@/app/admin/actions/work";
import { WorkEditor } from "@/components/admin/WorkEditor";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export const metadata = { title: "Edit work" };

export default async function EditWork({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const work = await db.work.findUnique({ where: { id: (await params).id }, include: { room: true } });
  if (!work) notFound();
  const [media, poster, rooms, cats] = await Promise.all([
    mediaById(work.mediaId),
    mediaById(work.posterId),
    db.room.findMany({ orderBy: { order: "asc" } }),
    db.work.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
  ]);
  return (
    <>
      <p className="a-crumbs">
        <Link href="/admin/work">Work</Link> / {work.room.name}
      </p>
      <div className="a-head">
        <h1 className="a-title">{work.title}</h1>
        {work.visible && (
          <a
            className="a-link"
            href={work.showCaseStudy ? `/work/${work.room.slug}/${work.slug}` : `/work/${work.room.slug}`}
            target="_blank"
            rel="noopener"
          >
            View on site ↗
          </a>
        )}
      </div>
      {(await searchParams).saved && (
        <p className="a-flash" role="status">
          Added. It’s live.
        </p>
      )}
      <WorkEditor
        work={work}
        media={media}
        poster={poster}
        rooms={rooms.map((r) => ({ value: r.id, label: r.name, slug: r.slug }))}
        categories={cats.map((c) => c.category!)}
        storage={storageMode()}
      />
      <form action={deleteWork} className="a-danger-zone">
        <input type="hidden" name="id" value={work.id} />
        <ConfirmSubmit message={`Delete “${work.title}” from the site? This can’t be undone.`}>
          Delete this piece
        </ConfirmSubmit>
      </form>
    </>
  );
}
