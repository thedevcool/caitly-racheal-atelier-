import { db } from "@/lib/db";
import { reorderRooms } from "@/app/admin/actions/rooms";
import { RoomList } from "@/components/admin/lists";

export const metadata = { title: "Rooms" };

export default async function Rooms() {
  const rooms = await db.room.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { works: true } } },
  });
  return (
    <>
      <h1 className="a-title">Rooms</h1>
      <p className="a-lede">
        Drag (or use the arrows) to change the order on the home page. Tap a room to edit its words.
      </p>
      <RoomList
        rooms={rooms.map((r) => ({
          id: r.id,
          label: r.name,
          korean: r.korean,
          visible: r.visible,
          works: r._count.works,
        }))}
        onReorder={reorderRooms}
      />
    </>
  );
}
