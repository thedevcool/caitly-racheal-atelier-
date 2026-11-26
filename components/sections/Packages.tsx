import Link from "next/link";
import type { RoomWithContent } from "@/lib/content";

/** Featured, published packages linked to their rooms. Renders nothing if none are published. */
export function Packages({ rooms }: { rooms: RoomWithContent[] }) {
  const pkgs = rooms.flatMap((r) => r.packages.filter((p) => p.featured).map((p) => ({ ...p, room: r })));
  if (!pkgs.length) return null;
  return (
    <section className="band" id="packages" aria-labelledby="packages-title">
      <div className="wrap">
        <p className="label">Packages</p>
        <h2 id="packages-title">Ways to begin.</h2>
        <div className="packages">
          {pkgs.map((p) => (
            <Link className="package" key={p.id} href={`/work/${p.room.slug}`}>
              <span className="ko" lang="ko" style={{ color: "var(--accent)", fontSize: 15 }}>
                {p.korean ?? p.room.korean} · {p.room.name}
              </span>
              <h3>{p.name}</h3>
              <span className="price">{p.priceFrom}</span>
              {p.items.length > 0 && (
                <ul>
                  {p.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
