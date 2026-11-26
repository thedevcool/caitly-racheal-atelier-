import Link from "next/link";
import { db } from "@/lib/db";
import { storageMode } from "@/lib/mediaSave";
import { WorkEditor } from "@/components/admin/WorkEditor";

export const metadata = { title: "Add new work" };

export default async function NewWork({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  const [rooms, cats] = await Promise.all([
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
        <Link href="/admin/work">Work</Link> / New
      </p>
      <h1 className="a-title">Add new work</h1>
      <WorkEditor
        rooms={rooms.map((r) => ({ value: r.id, label: r.name, slug: r.slug }))}
        categories={cats.map((c) => c.category!)}
        storage={storageMode()}
        defaultRoomId={rooms.find((r) => r.slug === room)?.id}
      />
    </>
  );
}
