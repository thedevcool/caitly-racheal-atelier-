import { db } from "@/lib/db";
import { roomOptions } from "@/lib/adminData";
import { reorderPackages } from "@/app/admin/actions/packages";
import { PackageManager } from "@/components/admin/lists";

export const metadata = { title: "Packages" };

export default async function Packages() {
  const [packages, rooms] = await Promise.all([
    db.package.findMany({ orderBy: { order: "asc" }, include: { room: true } }),
    roomOptions(),
  ]);
  return (
    <>
      <h1 className="a-title">Packages</h1>
      <p className="a-lede">
        Your prices. Published packages appear on the home page (if “Show on the home page” is on) and in
        their room. Drafts stay hidden until you publish them.
      </p>
      <PackageManager
        packages={packages.map((p) => ({
          id: p.id,
          label: p.name,
          roomId: p.roomId,
          roomName: p.room.name,
          korean: p.korean,
          priceFrom: p.priceFrom,
          items: p.items,
          featured: p.featured,
          visible: p.visible,
        }))}
        rooms={rooms}
        onReorder={reorderPackages}
      />
    </>
  );
}
